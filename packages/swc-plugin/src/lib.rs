use swc_core::{
    ecma::{
        ast::*,
        visit::{as_folder, FoldWith, VisitMut, VisitMutWith},
    },
    plugin::{plugin_transform, proxies::TransformPluginProgramMetadata},
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

mod types;
mod visitors;
pub mod utils;

use types::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompiledOptions {
    #[serde(default)]
    pub cache: Option<bool>,
    
    #[serde(default = "default_import_react")]
    pub import_react: bool,
    
    pub nonce: Option<String>,
    
    #[serde(default, rename = "importSources")]
    pub import_sources: Vec<String>,
    
    #[serde(default = "default_optimize_css")]
    pub optimize_css: bool,
    
    pub resolver: Option<String>,
    
    #[serde(default)]
    pub extensions: Vec<String>,
    
    #[serde(default, rename = "addComponentName")]
    pub add_component_name: bool,
    
    #[serde(default, rename = "classNameCompressionMap")]
    pub class_name_compression_map: HashMap<String, String>,
    
    #[serde(default = "default_process_xcss", rename = "processXcss")]
    pub process_xcss: bool,
    
    #[serde(default, rename = "strictMode")]
    pub strict_mode: bool,
    
    #[serde(default)]
    pub increase_specificity: bool,
    
    #[serde(default = "default_sort_at_rules")]
    pub sort_at_rules: bool,
    
    pub class_hash_prefix: Option<String>,
    
    #[serde(default = "default_flatten_multiple_selectors")]
    pub flatten_multiple_selectors: bool,
    
    pub filename: Option<String>,
}

fn default_import_react() -> bool { true }
fn default_optimize_css() -> bool { true }
fn default_process_xcss() -> bool { true }
fn default_sort_at_rules() -> bool { true }
fn default_flatten_multiple_selectors() -> bool { true }

impl Default for CompiledOptions {
    fn default() -> Self {
        Self {
            cache: Some(false),
            import_react: true,
            nonce: None,
            import_sources: vec![
                "@compiled/react".to_string(),
                "@atlaskit/css".to_string(),
            ],
            optimize_css: true,
            resolver: None,
            extensions: vec![],
            add_component_name: false,
            class_name_compression_map: HashMap::new(),
            process_xcss: true,
            strict_mode: false,
            increase_specificity: false,
            sort_at_rules: true,
            class_hash_prefix: None,
            flatten_multiple_selectors: true,
            filename: None,
        }
    }
}

pub struct CompiledTransform {
    pub options: CompiledOptions,
    pub collected_css_sheets: Vec<(String, String)>,
    pub css_content_to_var: HashMap<String, String>,
    pub state: TransformState,
    pub had_transformations: bool,
}

impl CompiledTransform {
    pub fn add_css_sheet_with_deduplication(&mut self, css_content: &str) -> String {
        if let Some(existing_var_name) = self.css_content_to_var.get(css_content) {
            return existing_var_name.clone();
        }
        
            let index = self.collected_css_sheets.len();
            let var_name = if index == 0 { "_".to_string() } else { format!("_{}", index + 1) };
        
        self.css_content_to_var.insert(css_content.to_string(), var_name.clone());
        self.collected_css_sheets.push((var_name.clone(), css_content.to_string()));
        
        var_name
    }
    
    #[allow(dead_code)]
    fn generate_unique_css_var_name(&self) -> String { format!("css_{}", self.collected_css_sheets.len()) }
    
    fn process_imports_and_pragmas(&mut self, module: &mut Module) {
        let mut imports_to_remove = Vec::new();
        
        
        for (i, item) in module.body.iter().enumerate() {
            if let ModuleItem::ModuleDecl(ModuleDecl::Import(import_decl)) = item {
                let source = import_decl.src.value.as_ref();
                
                
                let is_compiled_module = self.state.import_sources.iter().any(|import_source| {
                    import_source == source
                }) && !source.ends_with("/runtime"); // Don't process runtime imports
                
                
                if !is_compiled_module {
                    continue;
                }
                
                if self.state.compiled_imports.is_none() {
                    self.state.compiled_imports = Some(CompiledImports::new());
                }
                
                self.had_transformations = true;
                
                let mut should_remove_import = true;

                if import_decl.specifiers.is_empty() {
                    should_remove_import = true;
                } else {
                    for specifier in &import_decl.specifiers {
                        if let ImportSpecifier::Named(named) = specifier {
                            let imported_name = match &named.imported {
                                Some(ModuleExportName::Ident(ident)) => ident.sym.as_ref(),
                                None => named.local.sym.as_ref(),
                                _ => continue,
                            };
                            
                            let local_name = named.local.sym.to_string();
                            
                            if let Some(ref mut imports) = self.state.compiled_imports {
                                match imported_name {
                                    "css" => {
                                        if imports.css.is_none() {
                                            imports.css = Some(Vec::new());
                                        }
                                        imports.css.as_mut().unwrap().push(local_name);
                                    }
                                    "cssMap" => {
                                        if imports.css_map.is_none() {
                                            imports.css_map = Some(Vec::new());
                                        }
                                        imports.css_map.as_mut().unwrap().push(local_name);
                                    }
                                    _ => {
                                        should_remove_import = false;
                                    }
                                }
                            }
                        } else {
                            should_remove_import = false;
                        }
                    }
                }
                
                if should_remove_import {
                    imports_to_remove.push(i);
                }
            }
        }
        
        for &index in imports_to_remove.iter().rev() {
            module.body.remove(index);
        }
    }
    
    fn finalize_module(&mut self, module: &mut Module) {
        if self.state.compiled_imports.is_none() && !self.had_transformations {
            return;
        }
        
        self.add_runtime_imports(module);
        
        self.add_react_imports_if_needed(module);
    }
    
    fn add_react_imports_if_needed(&self, module: &mut Module) {
        let should_import_react = self.options.import_react;
        
        let mut has_react_namespace_or_default = false;
        
        for item in &module.body {
            if let ModuleItem::ModuleDecl(ModuleDecl::Import(import)) = item {
                if import.src.value.as_ref() == "react" {
                    for specifier in &import.specifiers {
                        match specifier {
                            ImportSpecifier::Default(_) | ImportSpecifier::Namespace(_) => {
                                has_react_namespace_or_default = true;
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
        
        if should_import_react && !has_react_namespace_or_default {
            let react_import = ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
                span: Default::default(),
                specifiers: vec![ImportSpecifier::Namespace(ImportStarAsSpecifier {
                    span: Default::default(),
                    local: utils::ast::create_ident("React"),
                })],
                src: Box::new(utils::ast::create_str_lit("react")),
                type_only: false,
                with: None,
                phase: Default::default(),
            }));
            module.body.insert(0, react_import);
        }
    }
    
    fn add_runtime_imports(&mut self, module: &mut Module) {
        for (var_name, css_text) in &self.collected_css_sheets {
            let css_declaration = ModuleItem::Stmt(Stmt::Decl(Decl::Var(Box::new(VarDecl {
                span: Default::default(),
                kind: VarDeclKind::Const,
                declare: false,
                decls: vec![VarDeclarator {
                    span: Default::default(),
                    name: Pat::Ident(BindingIdent {
                        id: utils::ast::create_ident(var_name),
                        type_ann: None,
                    }),
                    init: Some(Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit(css_text))))),
                    definite: false,
                }],
            }))));
            
            module.body.insert(0, css_declaration);
        }
        
        if self.state.compiled_imports.is_some() || !self.collected_css_sheets.is_empty() {
            let runtime_import = ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
                span: Default::default(),
                specifiers: vec![
                    ImportSpecifier::Named(ImportNamedSpecifier {
                        span: Default::default(),
                        local: utils::ast::create_ident("ax"),
                        imported: None,
                        is_type_only: false,
                    }),
                    ImportSpecifier::Named(ImportNamedSpecifier {
                        span: Default::default(),
                        local: utils::ast::create_ident("ix"),
                        imported: None,
                        is_type_only: false,
                    }),
                    ImportSpecifier::Named(ImportNamedSpecifier {
                        span: Default::default(),
                        local: utils::ast::create_ident("CC"),
                        imported: None,
                        is_type_only: false,
                    }),
                    ImportSpecifier::Named(ImportNamedSpecifier {
                        span: Default::default(),
                        local: utils::ast::create_ident("CS"),
                        imported: None,
                        is_type_only: false,
                    }),
                ],
                src: Box::new(utils::ast::create_str_lit("@compiled/react/runtime")),
                type_only: false,
                with: None,
                phase: Default::default(),
            }));
            
            module.body.insert(0, runtime_import);
        }
    }
}

impl VisitMut for CompiledTransform {
    fn visit_mut_module(&mut self, n: &mut Module) {
        self.process_imports_and_pragmas(n);
        
        n.visit_mut_children_with(self);
        
        if self.had_transformations {
            self.finalize_module(n);
        }
    }
    
    fn visit_mut_call_expr(&mut self, n: &mut CallExpr) {
        let mut handled_css_prop = false;
        let is_react_jsx_like = match &n.callee {
            Callee::Expr(callee_expr) => match callee_expr.as_ref() {
                Expr::Member(MemberExpr { prop, .. }) => {
                    matches!(prop, MemberProp::Ident(id) if id.sym.as_ref() == "createElement")
                }
                Expr::Ident(id) => id.sym.as_ref() == "jsx" || id.sym.as_ref() == "jsxs",
                _ => false,
            },
            _ => false,
        };
        if is_react_jsx_like && n.args.len() >= 2 {
            if let Expr::Object(props_obj) = n.args[1].expr.as_ref() {
                let mut css_prop_index: Option<usize> = None;
                let mut css_expr: Option<Box<Expr>> = None;
                for (i, prop) in props_obj.props.iter().enumerate() {
                    if let PropOrSpread::Prop(p) = prop {
                        if let Prop::KeyValue(kv) = p.as_ref() {
                            if matches!(&kv.key, PropName::Ident(id) if id.sym.as_ref() == "css") {
                                css_prop_index = Some(i);
                                css_expr = Some(kv.value.clone());
                                break;
                            }
                        }
                    }
                }
                if let (Some(idx), Some(expr_box)) = (css_prop_index, css_expr) {
                    if matches!(expr_box.as_ref(), Expr::Member(_) | Expr::Ident(_)) {
                        let ax_call = Expr::Call(CallExpr {
                            span: Default::default(),
                            callee: Callee::Expr(Box::new(Expr::Ident(utils::ast::create_ident("ax")))),
                            args: vec![ExprOrSpread {
                                spread: None,
                                expr: Box::new(Expr::Array(ArrayLit { span: Default::default(), elems: vec![Some(ExprOrSpread { spread: None, expr: expr_box })] })),
                            }],
                            type_args: None,
                        });
                        if let Expr::Object(obj_mut) = n.args[1].expr.as_mut() {
                            obj_mut.props.remove(idx);
                            obj_mut.props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                                key: PropName::Ident(utils::ast::create_ident("className")),
                                value: Box::new(ax_call),
                            }))));
                        }
                        handled_css_prop = true;
                    } else {
                        if self.options.strict_mode {
                            if let Err(msg) = visitors::css::is_static_expression_strict(expr_box.as_ref()) {
                                panic!("Strict mode error in css prop: {}", msg);
                            }
                        }
                        let atomic_rules = utils::css_builder::build_atomic_rules_from_expression(expr_box.as_ref());
                        if !atomic_rules.is_empty() {
                            let (sheets, class_names) = utils::css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
                            for sheet in sheets { let _ = self.add_css_sheet_with_deduplication(&sheet); }
                            if !class_names.is_empty() {
                                let ax_call = Expr::Call(CallExpr {
                                    span: Default::default(),
                                    callee: Callee::Expr(Box::new(Expr::Ident(utils::ast::create_ident("ax")))),
                                    args: vec![ExprOrSpread { spread: None, expr: Box::new(Expr::Array(ArrayLit { span: Default::default(), elems: class_names.into_iter().map(|cn| Some(ExprOrSpread { spread: None, expr: Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit(&cn)))) })).collect() })) }],
                                    type_args: None,
                                });
                                if let Expr::Object(obj_mut) = n.args[1].expr.as_mut() {
                                    obj_mut.props.remove(idx);
                                    obj_mut.props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp { key: PropName::Ident(utils::ast::create_ident("className")), value: Box::new(ax_call) }))));
                                }
                            } else if let Expr::Object(obj_mut) = n.args[1].expr.as_mut() {
                                obj_mut.props.remove(idx);
                            }
                            handled_css_prop = true;
                        }
                    }
                }
            }
        }

        if handled_css_prop {
            self.had_transformations = true;
            return;
        }


        n.visit_mut_children_with(self);
    }

    fn visit_mut_expr(&mut self, n: &mut Expr) {
        if let Expr::Call(call) = n {
            if visitors::css::is_css_call(call, &self.state) {
                if self.options.strict_mode {
                    if let Some(first) = call.args.get(0) {
                        if let Err(msg) = visitors::css::is_static_expression_strict(&first.expr) {
                            panic!("Strict mode error in css(): {}", msg);
                        }
                    }
                }
                if let Some(first) = call.args.get(0) {
                    let atomic_rules = utils::css_builder::build_atomic_rules_from_expression(&first.expr);
                    if !atomic_rules.is_empty() {
                        let (sheets, _class_names) = utils::css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
                        for sheet in sheets { let _ = self.add_css_sheet_with_deduplication(&sheet); }
                        *n = Expr::Lit(Lit::Null(Null { span: Default::default() }));
                        self.had_transformations = true;
                        return;
                    }
                }
            }
            if visitors::css_map::is_css_map_call(call, &self.state) {
                if call.args.len() != 1 { panic!("cssMap() must receive exactly one argument"); }
                let obj = match call.args[0].expr.as_ref() { Expr::Object(o) => o, _ => panic!("cssMap() argument must be an object") };
                if self.options.strict_mode {
                    if let Err(msg) = visitors::css_map::is_static_css_map_strict(obj) { panic!("Strict mode error in cssMap(): {}", msg); }
                }
                let mut props_out: Vec<PropOrSpread> = Vec::new();
                for prop in &obj.props {
                    if let PropOrSpread::Prop(p) = prop {
                        if let Prop::KeyValue(kv) = p.as_ref() {
                            let key_name = match &kv.key { PropName::Ident(i) => i.sym.to_string(), PropName::Str(s) => s.value.to_string(), _ => continue };
                            if let Expr::Object(variant_obj) = &*kv.value {
                                let atomic_rules = utils::css_builder::build_atomic_rules_from_object(variant_obj);
                                if !atomic_rules.is_empty() {
                                    let (sheets, class_names) = utils::css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
                                    for sheet in sheets { let _ = self.add_css_sheet_with_deduplication(&sheet); }
                                    let combined = class_names.join(" ");
                                    props_out.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp { key: PropName::Ident(utils::ast::create_ident(&key_name)), value: Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit(&combined)))) }))));
                                } else {
                                    props_out.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp { key: PropName::Ident(utils::ast::create_ident(&key_name)), value: Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit("")))) }))));
                                }
                            }
                        }
                    }
                }
                *n = Expr::Object(ObjectLit { span: Default::default(), props: props_out });
                self.had_transformations = true;
                return;
            }
        }
        n.visit_mut_children_with(self);
    }
    
    fn visit_mut_jsx_opening_element(&mut self, n: &mut JSXOpeningElement) {
        if visitors::css::visit_css_prop_jsx_element(
            n, 
            &mut self.state, 
            &mut self.css_content_to_var, 
            &mut self.collected_css_sheets,
            &self.options
        ) {
            self.had_transformations = true;
        }
        else if self.options.process_xcss {
            if visitors::xcss_prop::visit_xcss_prop_jsx_opening_element(
                n, 
                &mut self.state, 
                &mut self.css_content_to_var, 
                &mut self.collected_css_sheets,
                &self.options
            ) {
                self.had_transformations = true;
            }
        }
        
        n.visit_mut_children_with(self);
    }
}

#[plugin_transform]
pub fn process_transform(program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    let config = metadata
        .get_transform_plugin_config()
        .and_then(|config| serde_json::from_str::<CompiledOptions>(&config).ok())
        .unwrap_or_default();
    
    let mut state = TransformState::default();
    state.import_sources = config.import_sources.clone();
    
    let mut transform = CompiledTransform { 
        options: config,
        collected_css_sheets: Vec::new(),
        css_content_to_var: HashMap::new(),
        state,
        had_transformations: false,
    };
    
    let transformed = program.fold_with(&mut as_folder(&mut transform));
    
    transformed
}
