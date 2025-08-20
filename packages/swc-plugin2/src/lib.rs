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
pub struct CompiledOptions2 {
    #[serde(default, rename = "importSources")]
    pub import_sources: Vec<String>,

    #[serde(default)]
    pub development: bool,

    #[serde(default)]
    pub extract: bool,
}

impl Default for CompiledOptions2 {
    fn default() -> Self {
        Self {
            import_sources: vec!["@compiled/react".to_string(), "@atlaskit/css".to_string()],
            development: false,
            extract: true,
        }
    }
}

pub struct Transform2 {
    pub options: CompiledOptions2,
    pub collected_css_sheets: Vec<(String, String)>,
    pub css_content_to_var: HashMap<String, String>,
    pub state: TransformState,
    pub had_transformations: bool,
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
                                    // No styled support
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

    fn visit_mut_expr(&mut self, n: &mut Expr) {
        if let Expr::Call(call) = n {
            // Handle css()
            if visitors::css::is_css_call(call, &self.state) {
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
            // Handle cssMap()
            if visitors::css_map::is_css_map_call(call, &self.state) {
                if call.args.len() == 1 {
                    if let Expr::Object(obj) = call.args[0].expr.as_ref() {
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
            }
        }
        n.visit_mut_children_with(self);
    }

    fn visit_mut_var_declarator(&mut self, n: &mut VarDeclarator) {
        // Track `const styles = css({...})` to map identifier -> class names
        if let Some(init_expr) = &mut n.init {
            // First pass: extract info without mutating borrowed init_expr
            let mut css_assignment: Option<(Vec<String>, Vec<String>)> = None;
            let mut css_map_assignment: Option<(Vec<PropOrSpread>, std::collections::HashMap<String, types::CssMapVariantInfo>)> = None;
            if let Expr::Call(call) = init_expr.as_mut() {
                if visitors::css::is_css_call(call, &self.state) {
                    if let Some(first) = call.args.get(0) {
                        let atomic_rules = utils::css_builder::build_atomic_rules_from_expression(&first.expr);
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
                            let mut variant_info_map: std::collections::HashMap<String, types::CssMapVariantInfo> = std::collections::HashMap::new();
                            for prop in &obj.props {
                                if let PropOrSpread::Prop(p) = prop {
                                    if let Prop::KeyValue(kv) = p.as_ref() {
                                        let key_name = match &kv.key { PropName::Ident(i) => i.sym.to_string(), PropName::Str(s) => s.value.to_string(), _ => continue };
                                        if let Expr::Object(variant_obj) = &*kv.value {
                                            let atomic_rules = utils::css_builder::build_atomic_rules_from_object(variant_obj);
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
                                    let atomic_rules = utils::css_builder::build_atomic_rules_from_object(obj);
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
                                        let atomic_rules = utils::css_builder::build_atomic_rules_from_object(obj);
                                        if !atomic_rules.is_empty() {
                                            let (sheets, classes) = utils::css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
                                            for sheet in sheets { let var = self.add_css_sheet_with_deduplication(&sheet); sheet_vars.push(var); }
                                            class_names.extend(classes);
                                        }
                                    }
                                    Expr::Lit(Lit::Str(s)) => {
                                        let rules = utils::css_builder::build_atomic_rules_from_expression(&Expr::Lit(Lit::Str(s.clone())));
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
                        let rules = utils::css_builder::build_atomic_rules_from_expression(&Expr::Lit(Lit::Str(s.clone())));
                        if !rules.is_empty() {
                            let (sheets, classes) = utils::css_builder::transform_atomic_rules_to_sheets(&rules);
                            for sheet in sheets { let var = self.add_css_sheet_with_deduplication(&sheet); sheet_vars.push(var); }
                            class_names.extend(classes);
                        }
                    }
                    _ => {}
                }

                if !class_names.is_empty() {
                    // Build className attr with ax([...])
                    let elems: Vec<Option<ExprOrSpread>> = class_names.iter().map(|cn| Some(ExprOrSpread { spread: None, expr: Box::new(Expr::Lit(Lit::Str(utils::ast::create_str_lit(cn)))) })).collect();
                    let ax_call = Expr::Call(CallExpr { span: Default::default(), callee: Callee::Expr(Box::new(Expr::Ident(utils::ast::create_ident("ax")))), args: vec![ExprOrSpread { spread: None, expr: Box::new(Expr::Array(ArrayLit { span: Default::default(), elems: elems })) }], type_args: None });
                    // Replace css attr with className
                    n.opening.attrs.remove(idx);
                    n.opening.attrs.push(JSXAttrOrSpread::JSXAttr(JSXAttr { span: Default::default(), name: JSXAttrName::Ident(utils::ast::create_ident("className")), value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer { span: Default::default(), expr: JSXExpr::Expr(Box::new(ax_call)) })) }));

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
                                    let atomic_rules = utils::css_builder::build_atomic_rules_from_object(obj);
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
    };

    let transformed = program.fold_with(&mut as_folder(&mut transform));
    transformed
}

