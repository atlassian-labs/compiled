use swc_core::{
    ecma::{
        ast::*,
        visit::{as_folder, FoldWith, VisitMut, VisitMutWith},
    },
    plugin::{plugin_transform, proxies::TransformPluginProgramMetadata},
};
use serde::{Deserialize, Serialize};
use ahash::AHashMap as HashMap;
use std::fs;
use std::path::{Path, PathBuf};

mod types;
mod visitors;
pub mod utils;

use types::*;
// (No AssignTarget imports needed after removing displayName injection for now)

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompiledOptions2 {
    #[serde(default, rename = "importSources")]
    pub import_sources: Vec<String>,

    #[serde(default)]
    pub development: bool,

    #[serde(default)]
    pub extract: bool,

    #[serde(default, rename = "extractStylesToDirectory")]
    pub extract_styles_to_directory: Option<ExtractStylesToDirectory>,

    #[serde(default)]
    pub filename: Option<String>,

    #[serde(default, rename = "sourceFileName")]
    pub source_file_name: Option<String>,
}

impl Default for CompiledOptions2 {
    fn default() -> Self {
        Self {
            import_sources: vec!["@compiled/react".to_string(), "@atlaskit/css".to_string()],
            development: false,
            extract: true,
            extract_styles_to_directory: None,
            filename: None,
            source_file_name: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractStylesToDirectory {
    pub source: String,
    pub dest: String,
}

pub struct Transform2 {
    pub options: CompiledOptions2,
    pub collected_css_sheets: Vec<(String, String)>,
    pub css_content_to_var: HashMap<String, String>,
    pub state: TransformState,
    pub had_transformations: bool,
    pub used_styled: bool,
}

impl Transform2 {
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

    fn process_imports_and_pragmas(&mut self, module: &mut Module) {
        let mut imports_to_remove = Vec::new();

        for (i, item) in module.body.iter().enumerate() {
            if let ModuleItem::ModuleDecl(ModuleDecl::Import(import_decl)) = item {
                let source = import_decl.src.value.as_ref();

                let is_compiled_module = self.state.import_sources.iter().any(|s| s == source)
                    && !source.ends_with("/runtime");
                if !is_compiled_module { continue; }

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
                                        if imports.css.is_none() { imports.css = Some(Vec::new()); }
                                        imports.css.as_mut().unwrap().push(local_name);
                                    }
                                    "cssMap" => {
                                        if imports.css_map.is_none() { imports.css_map = Some(Vec::new()); }
                                        imports.css_map.as_mut().unwrap().push(local_name);
                                    }
                                    "styled" => {
                                        if self.state.compiled_imports.is_none() { self.state.compiled_imports = Some(CompiledImports::new()); }
                                        if self.state.compiled_imports.as_ref().unwrap().styled.is_none() { self.state.compiled_imports.as_mut().unwrap().styled = Some(Vec::new()); }
                                        self.state.compiled_imports.as_mut().unwrap().styled.as_mut().unwrap().push(local_name);
                                        // Keep the import in place
                                        should_remove_import = false;
                                    }
                                    "keyframes" => {
                                        if self.state.compiled_imports.is_none() { self.state.compiled_imports = Some(CompiledImports::new()); }
                                        if self.state.compiled_imports.as_ref().unwrap().keyframes.is_none() { self.state.compiled_imports.as_mut().unwrap().keyframes = Some(Vec::new()); }
                                        self.state.compiled_imports.as_mut().unwrap().keyframes.as_mut().unwrap().push(local_name);
                                        // Remove import specifier to match Babel behavior
                                    }
                                    _ => { should_remove_import = false; }
                                }
                            }
                        } else {
                            should_remove_import = false;
                        }
                    }
                }

                if should_remove_import { imports_to_remove.push(i); }
            }
        }
        for &index in imports_to_remove.iter().rev() { module.body.remove(index); }
    }

    fn finalize_module(&mut self, module: &mut Module) {
        if self.state.compiled_imports.is_none() && !self.had_transformations { return; }

        // Emit extracted sheets
        // - If extractStylesToDirectory is configured (and extract is true), write a .compiled.css file via WASI FS.
        // - Otherwise (including extract:false), emit const declarations as before.
        let should_write_css_file = self.options.extract
            && self.options.extract_styles_to_directory.is_some()
            && !self.collected_css_sheets.is_empty();

        if should_write_css_file {
            // Compute CSS filename from provided filename option
            let provided_filename = self.options.filename.clone().unwrap_or_else(|| "file.tsx".to_string());
            let base_name = Path::new(&provided_filename)
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| "file".to_string());
            let css_filename = format!("{}.compiled.css", base_name);

            // Validate source directory presence in source_file_name
            let esd = self.options.extract_styles_to_directory.as_ref().unwrap();
            let source_file_name = self.options.source_file_name.clone().unwrap_or_else(|| provided_filename.clone());
            if !source_file_name.contains(&esd.source) {
                panic!(
                    "{}: Source directory '{}' was not found relative to source file ('{}')",
                    source_file_name,
                    esd.source,
                    source_file_name
                );
            }

            let idx = source_file_name.find(&esd.source).unwrap();
            let rel_after_source = &source_file_name[idx + esd.source.len()..];
            let rel_dir = Path::new(rel_after_source).parent().unwrap_or(Path::new(""));

            // Build target path under WASI mount `/cwd`
            let mut target_path = PathBuf::from("/cwd");
            target_path = target_path.join(&esd.dest);
            // Avoid absolute reset by stripping any leading separators
            let rel_dir_clean = rel_dir.to_string_lossy().trim_start_matches(['/','\\']).to_string();
            if !rel_dir_clean.is_empty() { target_path = target_path.join(rel_dir_clean); }
            target_path = target_path.join(&css_filename);

            // Concatenate CSS rules in collected order
            let mut css_content: Vec<String> = Vec::new();
            for (_var_name, css_text) in &self.collected_css_sheets { css_content.push(css_text.clone()); }
            let css_joined = css_content.join("\n");

            // Write file (create directories as needed)
            if let Some(parent) = target_path.parent() { let _ = fs::create_dir_all(parent); }
            let _ = fs::write(&target_path, css_joined);

            // Add `import './<name>.compiled.css'` to the module
            let css_import = ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
                span: Default::default(),
                specifiers: vec![],
                src: Box::new(utils::ast::create_str_lit(&format!("./{}", css_filename))),
                type_only: false,
                with: None,
                phase: Default::default(),
            }));
            module.body.insert(0, css_import);
        } else {
            // Emit extracted sheets as consts
            for (var_name, css_text) in &self.collected_css_sheets {
                let var_decl = VarDecl {
                    span: Default::default(),
                    kind: VarDeclKind::Const,
                    declare: false,
                    decls: vec![VarDeclarator {
                        span: Default::default(),
                        name: Pat::Ident(BindingIdent { id: utils::ast::create_ident(var_name), type_ann: None }),
                        init: Some(Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit(css_text))))),
                        definite: false,
                    }],
                };
                let css_declaration = ModuleItem::Stmt(Stmt::Decl(Decl::Var(Box::new(var_decl))));
                module.body.insert(0, css_declaration);
            }
        }

        // Always import runtime ax/ix and when extract is false also import CC/CS
        if self.state.compiled_imports.is_some() || !self.collected_css_sheets.is_empty() {
            let mut specifiers: Vec<ImportSpecifier> = vec![
                ImportSpecifier::Named(ImportNamedSpecifier { span: Default::default(), local: utils::ast::create_ident("ax"), imported: None, is_type_only: false }),
                ImportSpecifier::Named(ImportNamedSpecifier { span: Default::default(), local: utils::ast::create_ident("ix"), imported: None, is_type_only: false }),
            ];
            if !self.options.extract {
                specifiers.push(ImportSpecifier::Named(ImportNamedSpecifier { span: Default::default(), local: utils::ast::create_ident("CC"), imported: None, is_type_only: false }));
                specifiers.push(ImportSpecifier::Named(ImportNamedSpecifier { span: Default::default(), local: utils::ast::create_ident("CS"), imported: None, is_type_only: false }));
            }
            let runtime_import = ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
                span: Default::default(),
                specifiers,
                src: Box::new(utils::ast::create_str_lit("@compiled/react/runtime")),
                type_only: false,
                with: None,
                phase: Default::default(),
            }));
            module.body.insert(0, runtime_import);
        }

        // If styled components were generated, import forwardRef from react
        if self.used_styled {
            let fr_import = ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
                span: Default::default(),
                specifiers: vec![ImportSpecifier::Named(ImportNamedSpecifier { span: Default::default(), local: utils::ast::create_ident("forwardRef"), imported: None, is_type_only: false })],
                src: Box::new(utils::ast::create_str_lit("react")),
                type_only: false,
                with: None,
                phase: Default::default(),
            }));
            module.body.insert(0, fr_import);
        }
    }
}

impl VisitMut for Transform2 {
    fn visit_mut_module(&mut self, n: &mut Module) {
        self.process_imports_and_pragmas(n);
        n.visit_mut_children_with(self);
        if self.had_transformations { self.finalize_module(n); }
    }

    fn visit_mut_call_expr(&mut self, n: &mut CallExpr) {
        // Defer transformations to visit_mut_expr where we can replace the full expression node
        n.visit_mut_children_with(self);
    }

    fn visit_mut_var_decl(&mut self, n: &mut VarDecl) {
        // Record only const bindings for simple literals/objects/arrays
        if n.kind == VarDeclKind::Const {
            for d in &n.decls {
                if let (Pat::Ident(binding), Some(init)) = (&d.name, &d.init) {
                    // Record any const initializer expression for potential static folding later
                    self.state
                        .const_bindings
                        .insert(binding.id.sym.to_string(), Box::new(init.as_ref().clone()));
                }
            }
        }
        n.visit_mut_children_with(self);
    }

    fn visit_mut_expr(&mut self, n: &mut Expr) {
        if let Expr::Call(call) = n.clone() {
            // keyframes() call handling: transform arg to @keyframes sheet and replace with null
            if visitors::keyframes::is_keyframes_call(&call, &self.state) {
                if let Some((sheet_text, kf_name, _var_specs)) = visitors::keyframes::transform_keyframes_call(&call, &mut self.state) {
                    let _var_name = self.add_css_sheet_with_deduplication(&sheet_text);
                    // Replace with string literal of the animation-name
                    *n = Expr::Lit(Lit::Str(utils::ast::create_str_lit(&kf_name)));
                    self.had_transformations = true;
                    return;
                }
            }
            // Handle css()
            if visitors::css::is_css_call(&call, &self.state) {
                if let Some(first) = call.args.get(0) {
                    let atomic_rules = utils::css_builder::build_atomic_rules_from_expression_with_state(&first.expr, &self.state);
                    if !atomic_rules.is_empty() {
                        let (sheets, _class_names) = utils::css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
                        for sheet in sheets { let _ = self.add_css_sheet_with_deduplication(&sheet); }
                        *n = Expr::Lit(Lit::Null(Null { span: Default::default() }));
                        self.had_transformations = true;
                        return;
                    }
                }
            }
            // Handle styled.div({...}) or styled(Component)({...}) or styled('div')({...})
            if visitors::styled::is_styled_call(&call, &self.state) {
                let (did, used_styled) = visitors::styled::transform_styled_call(n, &call, &mut self.state, &mut self.css_content_to_var, &mut self.collected_css_sheets, self.options.extract);
                if did {
                    if used_styled { self.used_styled = true; }
                    self.had_transformations = true;
                    return;
                }
            }
            // Handle cssMap()
            if visitors::css_map::is_css_map_call(&call, &self.state) {
                if call.args.len() == 1 {
                    if let Expr::Object(obj) = call.args[0].expr.as_ref() {
                        let mut props_out: Vec<PropOrSpread> = Vec::new();
                        for prop in &obj.props {
                            if let PropOrSpread::Prop(p) = prop {
                                if let Prop::KeyValue(kv) = p.as_ref() {
                                    let key_name = match &kv.key { PropName::Ident(i) => i.sym.to_string(), PropName::Str(s) => s.value.to_string(), _ => continue };
                                    if let Expr::Object(variant_obj) = &*kv.value {
                                        let atomic_rules = utils::css_builder::build_atomic_rules_from_object_with_state(variant_obj, &self.state);
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
            }
        }
        n.visit_mut_children_with(self);
    }

    fn visit_mut_var_declarator(&mut self, n: &mut VarDeclarator) {
        // Track `const styles = css({...})` to map identifier -> class names
        if let Some(init_expr) = &mut n.init {
            // After other transforms, attach displayName to styled components created via forwardRef
            // Detect init as forwardRef call and wrap in IIFE to set displayName in dev
            // Inject displayName in development for styled forwardRef outputs
            if let Expr::Call(call) = init_expr.as_ref() {
                let is_forward_ref = matches!(&call.callee, Callee::Expr(expr) if matches!(expr.as_ref(), Expr::Ident(id) if id.sym.as_ref()=="forwardRef"));
                if is_forward_ref {
                    if let Pat::Ident(binding) = &n.name {
                        let comp_name = binding.id.sym.to_string();
                        let tmp_ident = utils::ast::create_ident("__cmplc");
                        let inner_call_expr = (*init_expr.clone()).clone();
                        // const __cmplc = forwardRef(...)
                        let decl = Stmt::Decl(Decl::Var(Box::new(VarDecl { span: Default::default(), kind: VarDeclKind::Const, declare: false, decls: vec![VarDeclarator { span: Default::default(), name: Pat::Ident(BindingIdent { id: tmp_ident.clone(), type_ann: None }), init: Some(Box::new(inner_call_expr)), definite: false }] })));
                        // if (process.env.NODE_ENV !== 'production') { Object.defineProperty(__cmplc, 'displayName', { value: '<Name>' }); }
                        let prod_check = Expr::Bin(BinExpr { span: Default::default(), op: BinaryOp::NotEqEq, left: Box::new(Expr::Member(MemberExpr { span: Default::default(), obj: Box::new(Expr::Member(MemberExpr { span: Default::default(), obj: Box::new(Expr::Ident(utils::ast::create_ident("process"))), prop: MemberProp::Ident(utils::ast::create_ident("env")) })), prop: MemberProp::Ident(utils::ast::create_ident("NODE_ENV")) })), right: Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit("production")))) });
                        let define_prop_call = Expr::Call(CallExpr { span: Default::default(), callee: Callee::Expr(Box::new(Expr::Member(MemberExpr { span: Default::default(), obj: Box::new(Expr::Ident(utils::ast::create_ident("Object"))), prop: MemberProp::Ident(utils::ast::create_ident("defineProperty")) }))), args: vec![
                            ExprOrSpread { spread: None, expr: Box::new(Expr::Ident(tmp_ident.clone())) },
                            ExprOrSpread { spread: None, expr: Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit("displayName")))) },
                            ExprOrSpread { spread: None, expr: Box::new(Expr::Object(ObjectLit { span: Default::default(), props: vec![PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp { key: PropName::Ident(utils::ast::create_ident("value")), value: Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit(&comp_name)))) })))] })) },
                        ], type_args: None });
                        let if_stmt = Stmt::If(IfStmt { span: Default::default(), test: Box::new(prod_check), cons: Box::new(Stmt::Block(BlockStmt { span: Default::default(), stmts: vec![Stmt::Expr(ExprStmt { span: Default::default(), expr: Box::new(define_prop_call) })] })), alt: None });
                        let ret = Stmt::Return(ReturnStmt { span: Default::default(), arg: Some(Box::new(Expr::Ident(tmp_ident.clone()))) });
                        let body = BlockStmt { span: Default::default(), stmts: vec![decl, if_stmt, ret] };
                        let iife = Expr::Call(CallExpr { span: Default::default(), callee: Callee::Expr(Box::new(Expr::Arrow(ArrowExpr { span: Default::default(), params: vec![], body: Box::new(BlockStmtOrExpr::BlockStmt(body)), is_async: false, is_generator: false, type_params: None, return_type: None }))), args: vec![], type_args: None });
                        *init_expr = Box::new(iife);
                    }
                }
            }

            // First pass: extract info without mutating borrowed init_expr
            let mut css_assignment: Option<(Vec<String>, Vec<String>)> = None;
            let mut css_map_assignment: Option<(Vec<PropOrSpread>, ahash::AHashMap<String, types::CssMapVariantInfo>)> = None;
            if let Expr::Call(call) = init_expr.as_mut() {
                // keyframes recorded when assigned to const
                if visitors::keyframes::is_keyframes_call(call, &self.state) {
                    if let Some((sheet_text, kf_name, var_specs)) = visitors::keyframes::transform_keyframes_call(call, &mut self.state) {
                        let sheet_var = self.add_css_sheet_with_deduplication(&sheet_text);
                        if let Pat::Ident(binding) = &n.name {
                            self.state.keyframes_by_ident.insert(binding.id.sym.to_string(), types::KeyframesInfo { name: kf_name.clone(), sheet_var_name: Some(sheet_var.clone()), var_assignments: var_specs });
                        }
                        *init_expr = Box::new(Expr::Lit(Lit::Null(Null { span: Default::default() })));
                        self.had_transformations = true;
                        return;
                    }
                }
                if visitors::css::is_css_call(call, &self.state) {
                    if let Some(first) = call.args.get(0) {
                        let atomic_rules = utils::css_builder::build_atomic_rules_from_expression_with_state(&first.expr, &self.state);
                        if !atomic_rules.is_empty() {
                            let (sheets, class_names) = utils::css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
                            let mut sheet_vars: Vec<String> = Vec::new();
                            for sheet in sheets { let var = self.add_css_sheet_with_deduplication(&sheet); sheet_vars.push(var); }
                            css_assignment = Some((class_names, sheet_vars));
                        }
                    }
                }
                if visitors::css_map::is_css_map_call(call, &self.state) {
                    if call.args.len() == 1 {
                        if let Expr::Object(obj) = call.args[0].expr.as_ref() {
                            let mut props_out: Vec<PropOrSpread> = Vec::new();
                            let mut variant_info_map: ahash::AHashMap<String, types::CssMapVariantInfo> = ahash::AHashMap::new();
                            for prop in &obj.props {
                                if let PropOrSpread::Prop(p) = prop {
                                    if let Prop::KeyValue(kv) = p.as_ref() {
                                        let key_name = match &kv.key { PropName::Ident(i) => i.sym.to_string(), PropName::Str(s) => s.value.to_string(), _ => continue };
                                        if let Expr::Object(variant_obj) = &*kv.value {
                                            let atomic_rules = utils::css_builder::build_atomic_rules_from_object_with_state(variant_obj, &self.state);
                                            if !atomic_rules.is_empty() {
                                                let (sheets, class_names) = utils::css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
                                                let mut sheet_vars: Vec<String> = Vec::new();
                                                for sheet in sheets { let var = self.add_css_sheet_with_deduplication(&sheet); sheet_vars.push(var); }
                                                let combined = class_names.join(" ");
                                                props_out.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp { key: PropName::Ident(utils::ast::create_ident(&key_name)), value: Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit(&combined)))) }))));
                                                variant_info_map.insert(key_name, types::CssMapVariantInfo { class_names, sheet_var_names: sheet_vars });
                                            } else {
                                                props_out.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp { key: PropName::Ident(utils::ast::create_ident(&key_name)), value: Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit("")))) }))));
                                                variant_info_map.insert(key_name, types::CssMapVariantInfo { class_names: Vec::new(), sheet_var_names: Vec::new() });
                                            }
                                        }
                                    }
                                }
                            }
                            css_map_assignment = Some((props_out, variant_info_map));
                        }
                    }
                }
            }
            // Second pass: perform mutations
            if let Some((class_names, sheet_vars)) = css_assignment {
                if let Pat::Ident(binding) = &n.name {
                    let name = binding.id.sym.to_string();
                    self.state.css_classes_by_ident.insert(name, types::CssInfo { class_names, sheet_var_names: sheet_vars });
                }
                *init_expr = Box::new(Expr::Lit(Lit::Null(Null { span: Default::default() })));
                self.had_transformations = true;
            } else if let Some((props_out, variant_info_map)) = css_map_assignment {
                *init_expr = Box::new(Expr::Object(ObjectLit { span: Default::default(), props: props_out }));
                if let Pat::Ident(binding) = &n.name {
                    let name = binding.id.sym.to_string();
                    self.state.css_map.insert(name, variant_info_map);
                }
                self.had_transformations = true;
                return;
            }
        }
        n.visit_mut_children_with(self);
    }

    fn visit_mut_jsx_opening_element(&mut self, n: &mut JSXOpeningElement) {
        if visitors::css::visit_css_prop_jsx_element(n, &mut self.state, &mut self.css_content_to_var, &mut self.collected_css_sheets, self.options.extract) {
            self.had_transformations = true;
        }
        // Handle xcss inline object transformation (replace with class string) for extract:true only
        // We only modify the attribute value here; wrapping is handled in visit_mut_jsx_element when extract is false.
        for attr in &mut n.attrs {
            if let JSXAttrOrSpread::JSXAttr(jsx_attr) = attr {
                if let JSXAttrName::Ident(name_ident) = &jsx_attr.name {
                    let lower = name_ident.sym.to_string().to_lowercase();
                    if lower.ends_with("xcss") {
                        if !self.options.extract { continue; }
                        // Process only when it's an inline object, otherwise leave as-is
                        if let Some(JSXAttrValue::JSXExprContainer(container)) = &mut jsx_attr.value {
                            if let JSXExpr::Expr(expr) = &mut container.expr {
                                if let Expr::Object(obj) = expr.as_mut() {
                                    // Validate object is static: only literals and nested objects
                                    fn is_static_object(o: &ObjectLit) -> bool {
                                        for p in &o.props {
                                            if let PropOrSpread::Prop(pp) = p { if let Prop::KeyValue(kv) = pp.as_ref() {
                                                match &*kv.value {
                                                    Expr::Lit(Lit::Str(_)) | Expr::Lit(Lit::Num(_)) => {},
                                                    Expr::Object(inner) => { if !is_static_object(inner) { return false; } },
                                                    _ => { return false; }
                                                }
                                            }}
                                        }
                                        true
                                    }
                                    if !is_static_object(obj) { panic!("Object given to the xcss prop must be static"); }
                                    let atomic_rules = utils::css_builder::build_atomic_rules_from_object_with_state(obj, &self.state);
                                    if !atomic_rules.is_empty() {
                                        let (sheets, class_names) = utils::css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
                                        // Add sheets and ignore returned var names here; wrapping will collect again if needed
                                        for sheet in sheets { let _ = self.add_css_sheet_with_deduplication(&sheet); }
                                        let combined = class_names.join(" ");
                                        // Replace expression with string literal class name(s)
                                        *expr = Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit(&combined))));
                                        self.had_transformations = true;
                                    } else {
                                        // Replace with undefined
                                        *expr = Box::new(Expr::Ident(utils::ast::create_ident("undefined")));
                                        self.had_transformations = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        n.visit_mut_children_with(self);
    }

    fn visit_mut_jsx_element(&mut self, n: &mut JSXElement) {
        if !self.options.extract {
            // Find css attribute
            let mut css_attr_index: Option<usize> = None;
            for (i, attr) in n.opening.attrs.iter().enumerate() {
                if let JSXAttrOrSpread::JSXAttr(jsx_attr) = attr {
                    if let JSXAttrName::Ident(ident) = &jsx_attr.name {
                        if ident.sym.as_ref() == "css" { css_attr_index = Some(i); break; }
                    }
                }
            }
            if let Some(idx) = css_attr_index {
                // Determine class names and sheet vars
                let mut class_names: Vec<String> = Vec::new();
                let mut sheet_vars: Vec<String> = Vec::new();
                let attr = match &n.opening.attrs[idx] { JSXAttrOrSpread::JSXAttr(a) => a, _ => unreachable!() };
                // Handle JSX value
                match &attr.value {
                    Some(JSXAttrValue::JSXExprContainer(container)) => {
                        match &container.expr {
                            JSXExpr::Expr(expr) => {
                                match expr.as_ref() {
                                    Expr::Ident(id) => {
                                        if let Some(info) = self.state.css_classes_by_ident.get(&id.sym.to_string()) {
                                            class_names.extend(info.class_names.clone());
                                            sheet_vars.extend(info.sheet_var_names.clone());
                                        }
                                    }
                                    Expr::Array(array_lit) => {
                                        for maybe_elem in &array_lit.elems {
                                            if let Some(ExprOrSpread { expr: item_expr, .. }) = maybe_elem {
                                                if let Expr::Ident(id) = item_expr.as_ref() {
                                                    if let Some(info) = self.state.css_classes_by_ident.get(&id.sym.to_string()) {
                                                        class_names.extend(info.class_names.clone());
                                                        sheet_vars.extend(info.sheet_var_names.clone());
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    Expr::Object(obj) => {
                                        let atomic_rules = utils::css_builder::build_atomic_rules_from_object_with_state(obj, &self.state);
                                        if !atomic_rules.is_empty() {
                                            let (sheets, classes) = utils::css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
                                            for sheet in sheets { let var = self.add_css_sheet_with_deduplication(&sheet); sheet_vars.push(var); }
                                            class_names.extend(classes);
                                        }
                                    }
                                    Expr::Lit(Lit::Str(s)) => {
                                        let rules = utils::css_builder::build_atomic_rules_from_expression_with_state(&Expr::Lit(Lit::Str(s.clone())), &self.state);
                                        if !rules.is_empty() {
                                            let (sheets, classes) = utils::css_builder::transform_atomic_rules_to_sheets(&rules);
                                            for sheet in sheets { let var = self.add_css_sheet_with_deduplication(&sheet); sheet_vars.push(var); }
                                            class_names.extend(classes);
                                        }
                                    }
                                    _ => {}
                                }
                            }
                            _ => {}
                        }
                    }
                    Some(JSXAttrValue::Lit(Lit::Str(s))) => {
                        let rules = utils::css_builder::build_atomic_rules_from_expression_with_state(&Expr::Lit(Lit::Str(s.clone())), &self.state);
                        if !rules.is_empty() {
                            let (sheets, classes) = utils::css_builder::transform_atomic_rules_to_sheets(&rules);
                            for sheet in sheets { let var = self.add_css_sheet_with_deduplication(&sheet); sheet_vars.push(var); }
                            class_names.extend(classes);
                        }
                    }
                    _ => {}
                }

                if !class_names.is_empty() {
                    // Merge keyframe variable assignments into style if css references animationName or animation shorthand contains keyframes name
                    let mut style_props: Vec<PropOrSpread> = Vec::new();
                    // Spread existing style
                    style_props.push(PropOrSpread::Spread(SpreadElement { dot3_token: Default::default(), expr: Box::new(Expr::Ident(utils::ast::create_ident("__cmpls"))) }));
                    // Build ix() for any keyframes var specs if animationName references a known keyframe ident
                    if let JSXAttrOrSpread::JSXAttr(a) = &n.opening.attrs[idx] {
                        if let Some(JSXAttrValue::JSXExprContainer(container)) = &a.value {
                            if let JSXExpr::Expr(expr) = &container.expr {
                                if let Expr::Ident(id) = expr.as_ref() {
                                    if let Some(kf) = self.state.keyframes_by_ident.get(&id.sym.to_string()) {
                                        for spec in &kf.var_assignments {
                                            let mut ix_args: Vec<ExprOrSpread> = vec![ExprOrSpread { spread: None, expr: spec.value_expr.clone() }];
                                            if let Some(suf) = &spec.suffix { ix_args.push(ExprOrSpread { spread: None, expr: Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit(suf)))) }); }
                                            if let Some(pre) = &spec.prefix { ix_args.push(ExprOrSpread { spread: None, expr: Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit(pre)))) }); }
                                            let ix_call = Expr::Call(CallExpr { span: Default::default(), callee: Callee::Expr(Box::new(Expr::Ident(utils::ast::create_ident("ix")))), args: ix_args, type_args: None });
                                            style_props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp { key: PropName::Str(Str { span: Default::default(), value: format!("--{}", spec.var_name).into(), raw: None }), value: Box::new(ix_call) }))));
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // Build className attr with ax([...])
                    let elems: Vec<Option<ExprOrSpread>> = class_names.iter().map(|cn| Some(ExprOrSpread { spread: None, expr: Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit(cn)))) })).collect();
                    let ax_call = Expr::Call(CallExpr { span: Default::default(), callee: Callee::Expr(Box::new(Expr::Ident(utils::ast::create_ident("ax")))), args: vec![ExprOrSpread { spread: None, expr: Box::new(Expr::Array(ArrayLit { span: Default::default(), elems: elems })) }], type_args: None });
                    // Replace css attr with className
                    n.opening.attrs.remove(idx);
                    n.opening.attrs.push(JSXAttrOrSpread::JSXAttr(JSXAttr { span: Default::default(), name: JSXAttrName::Ident(utils::ast::create_ident("className")), value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer { span: Default::default(), expr: JSXExpr::Expr(Box::new(ax_call)) })) }));
                    if style_props.len() > 1 {
                        let style_obj = Expr::Object(ObjectLit { span: Default::default(), props: style_props });
                        n.opening.attrs.push(JSXAttrOrSpread::JSXAttr(JSXAttr { span: Default::default(), name: JSXAttrName::Ident(utils::ast::create_ident("style")), value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer { span: Default::default(), expr: JSXExpr::Expr(Box::new(style_obj)) })) }));
                    }

                    // Build <CS>{[sheet_vars]}</CS>
                    let cs_open = JSXOpeningElement { span: Default::default(), name: utils::ast::create_jsx_element_name("CS"), attrs: vec![], self_closing: false, type_args: None }; 
                    let cs_close = JSXClosingElement { span: Default::default(), name: utils::ast::create_jsx_element_name("CS") };
                    let cs_array_elems: Vec<Option<ExprOrSpread>> = sheet_vars.iter().map(|v| Some(ExprOrSpread { spread: None, expr: Box::new(Expr::Ident(utils::ast::create_ident(v))) })).collect();
                    let cs_expr = JSXExprContainer { span: Default::default(), expr: JSXExpr::Expr(Box::new(Expr::Array(ArrayLit { span: Default::default(), elems: cs_array_elems }))) };
                    let cs_elem = JSXElement { span: Default::default(), opening: cs_open, children: vec![JSXElementChild::JSXExprContainer(cs_expr)], closing: Some(cs_close) };

                    // Wrap with <CC> ... </CC>
                    let cc_open = JSXOpeningElement { span: Default::default(), name: utils::ast::create_jsx_element_name("CC"), attrs: vec![], self_closing: false, type_args: None };
                    let cc_close = JSXClosingElement { span: Default::default(), name: utils::ast::create_jsx_element_name("CC") };

                    // Clone modified original element for child
                    let original = n.clone();
                    let original_expr = JSXExprContainer { span: Default::default(), expr: JSXExpr::Expr(Box::new(Expr::JSXElement(Box::new(original)))) };

                    let cc_children = vec![JSXElementChild::JSXElement(Box::new(cs_elem)), JSXElementChild::JSXExprContainer(original_expr)];
                    let cc_elem = JSXElement { span: Default::default(), opening: cc_open, children: cc_children, closing: Some(cc_close) };
                    *n = cc_elem;
                    self.had_transformations = true;
                    return;
                }
            }
        }
        // For extract:false, wrap xcss usages that refer to generated sheets (inline object or cssMap variants)
        if !self.options.extract {
            // Locate xcss attr
            let mut xcss_attr_index: Option<usize> = None;
            for (i, attr) in n.opening.attrs.iter().enumerate() {
                if let JSXAttrOrSpread::JSXAttr(jsx_attr) = attr {
                    if let JSXAttrName::Ident(ident) = &jsx_attr.name {
                        if ident.sym.to_string().to_lowercase().ends_with("xcss") { xcss_attr_index = Some(i); break; }
                    }
                }
            }
            if let Some(idx) = xcss_attr_index {
                // Collect sheet var names referenced by xcss attr
                let mut sheet_vars: Vec<String> = Vec::new();
                let attr_ptr = match &mut n.opening.attrs[idx] { JSXAttrOrSpread::JSXAttr(a) => a, _ => unreachable!() };
                match &mut attr_ptr.value {
                    Some(JSXAttrValue::JSXExprContainer(container)) => {
                        match &mut container.expr {
                            JSXExpr::Expr(expr) => {
                                // If inline object, compute sheets now and replace with class string
                                let mut handled_inline = false;
                                if let Expr::Object(obj) = expr.as_mut() {
                                    let atomic_rules = utils::css_builder::build_atomic_rules_from_object_with_state(obj, &self.state);
                                    if !atomic_rules.is_empty() {
                                        let (sheets, class_names) = utils::css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
                                        for sheet in sheets { let var = self.add_css_sheet_with_deduplication(&sheet); sheet_vars.push(var); }
                                        let combined = class_names.join(" ");
                                        *expr = Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit(&combined))));
                                        handled_inline = true;
                                    } else {
                                        *expr = Box::new(Expr::Ident(utils::ast::create_ident("undefined")));
                                        handled_inline = true;
                                    }
                                }
                                if !handled_inline {
                                    utils::xcss::collect_sheet_vars_from_xcss_expr(expr.as_ref(), &self.state, &mut sheet_vars);
                                }
                            }
                            _ => {}
                        }
                    }
                    _ => {}
                }
                if !sheet_vars.is_empty() {
                    // Build <CS>{[sheet_vars]}</CS>
                    let cs_open = JSXOpeningElement { span: Default::default(), name: utils::ast::create_jsx_element_name("CS"), attrs: vec![], self_closing: false, type_args: None }; 
                    let cs_close = JSXClosingElement { span: Default::default(), name: utils::ast::create_jsx_element_name("CS") };
                    let cs_array_elems: Vec<Option<ExprOrSpread>> = sheet_vars.iter().map(|v| Some(ExprOrSpread { spread: None, expr: Box::new(Expr::Ident(utils::ast::create_ident(v))) })).collect();
                    let cs_expr = JSXExprContainer { span: Default::default(), expr: JSXExpr::Expr(Box::new(Expr::Array(ArrayLit { span: Default::default(), elems: cs_array_elems }))) };
                    let cs_elem = JSXElement { span: Default::default(), opening: cs_open, children: vec![JSXElementChild::JSXExprContainer(cs_expr)], closing: Some(cs_close) };
                    // Wrap with <CC> ... </CC>
                    let cc_open = JSXOpeningElement { span: Default::default(), name: utils::ast::create_jsx_element_name("CC"), attrs: vec![], self_closing: false, type_args: None };
                    let cc_close = JSXClosingElement { span: Default::default(), name: utils::ast::create_jsx_element_name("CC") };
                    let original = n.clone();
                    let original_expr = JSXExprContainer { span: Default::default(), expr: JSXExpr::Expr(Box::new(Expr::JSXElement(Box::new(original)))) };
                    let cc_children = vec![JSXElementChild::JSXElement(Box::new(cs_elem)), JSXElementChild::JSXExprContainer(original_expr)];
                    let cc_elem = JSXElement { span: Default::default(), opening: cc_open, children: cc_children, closing: Some(cc_close) };
                    *n = cc_elem;
                    self.had_transformations = true;
                    return;
                }
            }
        }
        n.visit_mut_children_with(self);
    }
}

#[plugin_transform]
pub fn process_transform(program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    let config = metadata
        .get_transform_plugin_config()
        .and_then(|config| serde_json::from_str::<CompiledOptions2>(&config).ok())
        .unwrap_or_default();

    let mut state = TransformState::default();
    state.import_sources = config.import_sources.clone();

    let mut transform = Transform2 {
        options: config,
        collected_css_sheets: Vec::new(),
        css_content_to_var: HashMap::new(),
        state,
        had_transformations: false,
        used_styled: false,
    };

    let transformed = program.fold_with(&mut as_folder(&mut transform));
    transformed
}

