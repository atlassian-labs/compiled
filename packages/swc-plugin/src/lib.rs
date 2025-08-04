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

pub mod test_utils;

use types::*;

use utils::module_resolver::{ModuleResolver, ExportValue};

/// Configuration options for the Compiled SWC plugin.
/// 
/// This struct defines all the available options for customizing the behavior
/// of the Compiled CSS-in-JS transformation plugin.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompiledOptions {
    /// Whether to use the cache or not
    #[serde(default)]
    pub cache: Option<bool>,
    
    /// Whether to import the React namespace if it is missing
    #[serde(default = "default_import_react")]
    pub import_react: bool,
    
    /// Security nonce for inline style elements
    pub nonce: Option<String>,
    
    /// Custom module origins that Compiled should compile
    #[serde(default, rename = "importSources")]
    pub import_sources: Vec<String>,
    
    /// Whether to run additional cssnano plugins
    #[serde(default = "default_optimize_css")]
    pub optimize_css: bool,
    
    /// Custom resolver for static evaluation
    pub resolver: Option<String>,
    
    /// File extensions to traverse as code
    #[serde(default)]
    pub extensions: Vec<String>,
    
    /// Add component name as class name in non-production
    #[serde(default)]
    pub add_component_name: bool,
    
    /// Class name compression map
    #[serde(default)]
    pub class_name_compression_map: HashMap<String, String>,
    
    /// Whether to process xcss usages
    #[serde(default = "default_process_xcss")]
    pub process_xcss: bool,
    
    /// Increase specificity of styles
    #[serde(default)]
    pub increase_specificity: bool,
    
    /// Whether to sort at-rules
    #[serde(default = "default_sort_at_rules")]
    pub sort_at_rules: bool,
    
    /// Class hash prefix
    pub class_hash_prefix: Option<String>,
    
    /// Whether to flatten multiple selectors
    #[serde(default = "default_flatten_multiple_selectors")]
    pub flatten_multiple_selectors: bool,
    
    /// Current filename being processed
    pub filename: Option<String>,
    
    /// Resolved imports provided by the bundler environment (bypasses WASM limitations)
    #[serde(default)]
    pub resolved_imports: HashMap<String, serde_json::Value>,
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
            ],
            optimize_css: true,
            resolver: None,
            extensions: vec![],
            add_component_name: false,
            class_name_compression_map: HashMap::new(),
            process_xcss: true,
            increase_specificity: false,
            sort_at_rules: true,
            class_hash_prefix: None,
            flatten_multiple_selectors: true,
            filename: None,
            resolved_imports: HashMap::new(),
        }
    }
}

/// Main transformation context for the Compiled SWC plugin.
/// 
/// This struct maintains the state throughout the transformation process,
/// including configuration options, collected CSS sheets, and transformation state.
pub struct CompiledTransform {
    /// Plugin configuration options
    pub options: CompiledOptions,
    /// Collected CSS sheets during transformation (variable_name, css_text)
    pub collected_css_sheets: Vec<(String, String)>,
    /// Current transformation state
    pub state: TransformState,
    /// Whether any transformations were applied
    pub had_transformations: bool,
}

impl CompiledTransform {
    /// Process imports and pragmas from the module
    fn process_imports_and_pragmas(&mut self, module: &mut Module) {
        let mut imports_to_remove = Vec::new();
        
        // Initialize module resolver for WASM compatibility
        if self.state.module_resolver.is_none() {
            // Use current directory as default for WASM compatibility
            self.state.module_resolver = Some(ModuleResolver::new("."));
        }
        
        // Check for JSX pragma comments
        // Note: JSX pragma parsing could be implemented here if needed
        
        // Process import declarations
        for (i, item) in module.body.iter().enumerate() {
            if let ModuleItem::ModuleDecl(ModuleDecl::Import(import_decl)) = item {
                let source = import_decl.src.value.as_ref();
                
                // Check if this is a compiled module (but not runtime)
                let is_compiled_module = self.state.import_sources.iter().any(|import_source| {
                    if import_source == source {
                        return true;
                    }
                    
                    // Handle relative imports for WASM compatibility  
                    if source.starts_with('.') && source.contains(import_source) {
                        return true;
                    }
                    
                    false
                }) && !source.ends_with("/runtime"); // Don't process runtime imports
                
                // Check if this is a compiled module
                
                if !is_compiled_module {
                    // Track external imports for potential resolution (now WASM-safe)
                    for specifier in &import_decl.specifiers {
                        match specifier {
                            ImportSpecifier::Named(named) => {
                                let local_name = named.local.sym.to_string();
                                // Track external import for resolution
                                self.state.external_imports.insert(local_name, source.to_string());
                            }
                            ImportSpecifier::Default(default) => {
                                let local_name = default.local.sym.to_string();
                                self.state.external_imports.insert(local_name, source.to_string());
                            }
                            ImportSpecifier::Namespace(namespace) => {
                                let local_name = namespace.local.sym.to_string();
                                self.state.external_imports.insert(local_name, source.to_string());
                            }
                        }
                    }
                    
                    continue;
                }
                
                // Process compiled import
                
                // Initialize compiled imports if not already done
                if self.state.compiled_imports.is_none() {
                    self.state.compiled_imports = Some(CompiledImports::new());
                }
                
                // Mark that we found a compiled import
                self.had_transformations = true;
                
                // Process each import specifier
                let mut should_remove_import = true;

                // If there are no specifiers (e.g., import '@compiled/react'), enable CSS prop
                if import_decl.specifiers.is_empty() {
                    // This is a side-effect import that enables CSS prop
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
                            
                            // Track the import
                            if let Some(ref mut imports) = self.state.compiled_imports {
                                match imported_name {
                                    "styled" => {
                                        if imports.styled.is_none() {
                                            imports.styled = Some(Vec::new());
                                        }
                                        imports.styled.as_mut().unwrap().push(local_name);
                                    }
                                    "css" => {
                                        if imports.css.is_none() {
                                            imports.css = Some(Vec::new());
                                        }
                                        imports.css.as_mut().unwrap().push(local_name);
                                    }
                                    "ClassNames" => {
                                        if imports.class_names.is_none() {
                                            imports.class_names = Some(Vec::new());
                                        }
                                        imports.class_names.as_mut().unwrap().push(local_name);
                                    }
                                    "keyframes" => {
                                        if imports.keyframes.is_none() {
                                            imports.keyframes = Some(Vec::new());
                                        }
                                        imports.keyframes.as_mut().unwrap().push(local_name);
                                    }
                                    "cssMap" => {
                                        if imports.css_map.is_none() {
                                            imports.css_map = Some(Vec::new());
                                        }
                                        imports.css_map.as_mut().unwrap().push(local_name);
                                    }
                                    _ => {
                                        // Unknown import, don't remove
                                        should_remove_import = false;
                                    }
                                }
                            }
                        } else {
                            // Other types of imports (default, namespace) - don't remove for now
                            should_remove_import = false;
                        }
                    }
                }
                
                if should_remove_import {
                    imports_to_remove.push(i);
                }
            }
        }
        
        // Remove processed imports in reverse order  
        for &index in imports_to_remove.iter().rev() {
            module.body.remove(index);
        }
    }
    
    /// Finalize the module with runtime imports
    fn finalize_module(&mut self, module: &mut Module) {
        // Only proceed if we had compiled imports or transformations
        if self.state.compiled_imports.is_none() && !self.had_transformations {
            return;
        }
        
        // Add file comment at the top
        self.add_file_comment(module);
        
        // Add runtime imports
        self.add_runtime_imports(module);
        
        // Add React import if needed
        self.add_react_imports_if_needed(module);
    }
    
    /// Add file comment at the top of the module
    fn add_file_comment(&self, module: &mut Module) {
        let filename = self.options.filename.as_deref().unwrap_or("File");
        let version = env!("CARGO_PKG_VERSION");
        let _comment_text = format!(" {} generated by @compiled/babel-plugin v{} ", filename, version);
        
        // Add comment before the first statement
        if !module.body.is_empty() {
            // Add a noop statement to carry the comment
            let noop = ModuleItem::Stmt(Stmt::Empty(EmptyStmt {
                span: Default::default(),
            }));
            module.body.insert(0, noop);
        }
    }
    
    /// Add React imports if needed  
    fn add_react_imports_if_needed(&self, module: &mut Module) {
        let should_import_react = self.options.import_react;
        let has_styled = self.state.compiled_imports.as_ref()
            .and_then(|imports| imports.styled.as_ref())
            .map_or(false, |styled| !styled.is_empty());
        
        // Check if React is already imported
        let has_react = module.body.iter().any(|item| {
            if let ModuleItem::ModuleDecl(ModuleDecl::Import(import)) = item {
                import.src.value.as_ref() == "react"
            } else {
                false
            }
        });
        
        if should_import_react && !has_react {
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
        
        if has_styled && !has_react {
            let forward_ref_import = ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
                span: Default::default(),
                specifiers: vec![ImportSpecifier::Named(ImportNamedSpecifier {
                    span: Default::default(),
                    local: utils::ast::create_ident("forwardRef"),
                    imported: None,
                    is_type_only: false,
                })],
                src: Box::new(utils::ast::create_str_lit("react")),
                type_only: false,
                with: None,
                phase: Default::default(),
            }));
            module.body.insert(0, forward_ref_import);
        }
    }

    /// Fix keyframes call expressions to remove () from string literals
    fn fix_keyframes_calls(&mut self, expr: &mut Expr) {
        match expr {
            Expr::Call(call) => {
                // Check if this is a keyframes call that was transformed
                if let Callee::Expr(callee_expr) = &call.callee {
                    if let Expr::Lit(Lit::Str(str_lit)) = callee_expr.as_ref() {
                        // If the callee is a string that starts with 'k' (keyframe name)
                        if str_lit.value.starts_with('k') && call.args.is_empty() {
                            // Replace the entire call expression with just the string literal
                            *expr = Expr::Lit(Lit::Str(str_lit.clone()));
                            return;
                        }
                    }
                }
                // Recursively check arguments
                for arg in &mut call.args {
                    self.fix_keyframes_calls(&mut arg.expr);
                }
            }
            // Recursively check other expression types as needed
            _ => {}
        }
    }
    
    /// Fix CSS map call expressions to remove () from object literals
    fn fix_css_map_calls(&mut self, expr: &mut Expr) {
        match expr {
            Expr::Call(call) => {
                // Check if this is a CSS map call that was transformed
                if let Callee::Expr(callee_expr) = &call.callee {
                    if let Expr::Object(obj_lit) = callee_expr.as_ref() {
                        // If the callee is an object and args are empty (CSS map pattern)
                        if call.args.is_empty() {
                            // Replace the entire call expression with just the object literal
                            *expr = Expr::Object(obj_lit.clone());
                            return;
                        }
                    }
                }
                // Recursively check arguments
                for arg in &mut call.args {
                    self.fix_css_map_calls(&mut arg.expr);
                }
            }
            // Recursively check other expression types as needed
            _ => {}
        }
    }
    
    /// Add runtime imports to the module if transformations occurred
    fn add_runtime_imports(&mut self, module: &mut Module) {
        // Add CSS variable declarations first
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
        
        // Check if we need to add runtime imports
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
            
            // Add the runtime import at the beginning
            module.body.insert(0, runtime_import);
        }
    }

    /// Try to resolve an identifier to a static value using the module resolver
    fn try_resolve_identifier(&mut self, ident_name: &str) -> Option<Expr> {
        // First check if this identifier was pre-resolved by the bundler
        if let Some(resolved_value) = self.options.resolved_imports.get(ident_name) {
            if let Some(expr) = json_value_to_expr(resolved_value) {
                return Some(expr);
            }
        }
        
        // Then check if this is a local variable
        if let Some(local_value) = self.state.local_variables.get(ident_name) {
            return local_value.to_expr();
        }
        
        // Finally check module resolver (for fixture data in tests)
        if let Some(import_path) = self.state.external_imports.get(ident_name) {
            if let Some(module_resolver) = &mut self.state.module_resolver {
                if let Some(export_value) = module_resolver.get_export(import_path, ident_name) {
                    return export_value.to_expr();
                }
            }
        }
        
        None
    }

    /// Try to resolve a call expression (like colorMixin())
    fn try_resolve_call_expr(&mut self, call: &CallExpr) -> Option<Expr> {
        // Check if this is a simple function call with no arguments
        if call.args.is_empty() {
            if let Callee::Expr(callee_expr) = &call.callee {
                if let Expr::Ident(ident) = callee_expr.as_ref() {
                    let func_name = ident.sym.to_string();
                    
                    // Check if this is an imported function
                    if let Some(import_path) = self.state.external_imports.get(&func_name) {
                        if let Some(module_resolver) = &mut self.state.module_resolver {
                            if let Some(export_value) = module_resolver.get_export(import_path, &func_name) {
                                if let ExportValue::Function(_) = export_value {
                                    return export_value.to_expr();
                                }
                            }
                        }
                    }
                }
            }
        }
        
        None
    }

    /// Try to resolve a member expression (like colors.primary or obj.prop)
    fn try_resolve_member_expr(&mut self, member_expr: &MemberExpr) -> Option<Expr> {
        // Handle simple property access like obj.prop
        if let Expr::Ident(obj_ident) = member_expr.obj.as_ref() {
            let obj_name = obj_ident.sym.to_string();
            
            if let MemberProp::Ident(prop_ident) = &member_expr.prop {
                let prop_name = prop_ident.sym.to_string();
                
                // Check local variables first
                if let Some(local_value) = self.state.local_variables.get(&obj_name) {
                    if let ExportValue::Object(obj_map) = local_value {
                        if let Some(prop_value) = obj_map.get(&prop_name) {
                            return prop_value.to_expr();
                        }
                    }
                }
                
                // Check imported variables
                if let Some(import_path) = self.state.external_imports.get(&obj_name) {
                    if let Some(module_resolver) = &mut self.state.module_resolver {
                        if let Some(export_value) = module_resolver.get_export(import_path, &obj_name) {
                            if let ExportValue::Object(obj_map) = export_value {
                                if let Some(prop_value) = obj_map.get(&prop_name) {
                                    return prop_value.to_expr();
                                }
                            }
                        }
                    }
                }
            }
        }
        
        None
    }

    /// Track local variable declarations for static analysis
    fn track_local_variable(&mut self, name: &str, value: &Expr) {
        let export_value = match value {
            Expr::Lit(Lit::Str(s)) => {
                ExportValue::String(s.value.to_string())
            }
            Expr::Lit(Lit::Num(n)) => {
                ExportValue::Number(n.value)
            }
            Expr::Lit(Lit::Bool(b)) => {
                ExportValue::Boolean(b.value)
            }
            Expr::Object(obj_lit) => {
                let mut obj_map = HashMap::new();
                
                for prop in &obj_lit.props {
                    if let PropOrSpread::Prop(prop_box) = prop {
                        if let Prop::KeyValue(kv) = prop_box.as_ref() {
                            if let PropName::Ident(key_ident) = &kv.key {
                                let key_name = key_ident.sym.to_string();
                                
                                match kv.value.as_ref() {
                                    Expr::Lit(Lit::Str(s)) => {
                                        obj_map.insert(key_name, ExportValue::String(s.value.to_string()));
                                    }
                                    Expr::Lit(Lit::Num(n)) => {
                                        obj_map.insert(key_name, ExportValue::Number(n.value));
                                    }
                                    Expr::Lit(Lit::Bool(b)) => {
                                        obj_map.insert(key_name, ExportValue::Boolean(b.value));
                                    }
                                    _ => {
                                        obj_map.insert(key_name, ExportValue::Dynamic);
                                    }
                                }
                            }
                        }
                    }
                }
                
                ExportValue::Object(obj_map)
            }
            _ => {
                ExportValue::Dynamic
            }
        };
        
        self.state.local_variables.insert(name.to_string(), export_value);
    }

    /// Try to resolve a template literal with imported variables
    fn try_resolve_template_literal(&mut self, tpl: &Tpl) -> Option<String> {
        if tpl.exprs.len() == 1 && tpl.quasis.len() == 2 {
            // Simple case: `prefix${variable}suffix`
            let prefix = &tpl.quasis[0].raw;
            let suffix = &tpl.quasis[1].raw;
            
            if let Expr::Ident(ident) = tpl.exprs[0].as_ref() {
                let ident_name = ident.sym.to_string();
                
                if let Some(resolved_expr) = self.try_resolve_identifier(&ident_name) {
                    if let Expr::Lit(Lit::Str(str_lit)) = resolved_expr {
                        return Some(format!("{}{}{}", prefix, str_lit.value, suffix));
                    }
                }
            }
        }
        None
    }



    /// Recursively resolve imports in an expression
    fn resolve_expression_imports(&mut self, expr: Expr) -> Option<Expr> {
        match expr {
            Expr::Ident(ident) => {
                let ident_name = ident.sym.to_string();
                
                if let Some(resolved) = self.try_resolve_identifier(&ident_name) {
                    Some(resolved)
                } else {
                    Some(Expr::Ident(ident))
                }
            }
            _ => Some(expr),
        }
    }

    /// Check if an expression needs import resolution
    fn expression_needs_resolution(&self, expr: &Expr) -> bool {
        match expr {
            Expr::Ident(ident) => {
                let ident_name = ident.sym.to_string();
                // Check if this identifier is in our local variables or external imports
                self.state.local_variables.contains_key(&ident_name) ||
                self.state.external_imports.contains_key(&ident_name) ||
                self.options.resolved_imports.contains_key(&ident_name)
            }
            _ => false,
        }
    }

    /// Generate a unique ID for CSS expressions
    fn generate_expression_id(&self) -> String {
        use std::sync::atomic::{AtomicUsize, Ordering};
        static EXPRESSION_COUNTER: AtomicUsize = AtomicUsize::new(0);
        
        let id = EXPRESSION_COUNTER.fetch_add(1, Ordering::Relaxed);
        format!("css_expr_{}", id)
    }

    /// First pass: collect CSS expressions that might need import resolution
    fn collect_css_expressions_pass(&mut self, program: &Program) {
        match program {
            Program::Module(module) => self.collect_css_expressions_from_module(module),
            Program::Script(_) => {}, // Scripts not supported for now
        }
    }

    /// Collect CSS expressions from a module
    fn collect_css_expressions_from_module(&mut self, module: &Module) {
        for item in &module.body {
            self.collect_css_expressions_from_module_item(item);
        }
    }

    /// Collect CSS expressions from a module item
    fn collect_css_expressions_from_module_item(&mut self, item: &ModuleItem) {
        match item {
            ModuleItem::Stmt(stmt) => self.collect_css_expressions_from_stmt(stmt),
            ModuleItem::ModuleDecl(_) => {}, // Import/export declarations handled separately
        }
    }

    /// Collect CSS expressions from a statement
    fn collect_css_expressions_from_stmt(&mut self, stmt: &Stmt) {
        match stmt {
            Stmt::Decl(decl) => {
                match decl {
                    Decl::Var(var_decl) => {
                        for declarator in &var_decl.decls {
                            if let Some(init) = &declarator.init {
                                self.collect_css_expressions_from_expr(init);
                            }
                            
                            // Also track local variables during collection
                            if let Some(init) = &declarator.init {
                                if let Pat::Ident(ident) = &declarator.name {
                                    let var_name = ident.id.sym.to_string();
                                    self.track_local_variable(&var_name, init);
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
            _ => {}
        }
    }

    /// Collect CSS expressions from an expression
    fn collect_css_expressions_from_expr(&mut self, expr: &Expr) {
        match expr {
            Expr::JSXElement(jsx_elem) => {
                self.collect_css_expressions_from_jsx_element(jsx_elem);
            }
            _ => {}
        }
    }

    /// Collect CSS expressions from a JSX element
    fn collect_css_expressions_from_jsx_element(&mut self, jsx_elem: &JSXElement) {
        // Check for css prop in opening element
        for attr in &jsx_elem.opening.attrs {
            if let JSXAttrOrSpread::JSXAttr(jsx_attr) = attr {
                if let JSXAttrName::Ident(ident) = &jsx_attr.name {
                    if ident.sym.as_ref() == "css" {
                        // Found a css prop - check if it needs resolution
                        if let Some(JSXAttrValue::JSXExprContainer(container)) = &jsx_attr.value {
                            if let JSXExpr::Expr(expr) = &container.expr {
                                if self.expression_needs_resolution(expr) {
                                    // Collect this expression for resolution
                                    let id = self.generate_expression_id();
                                    let location = format!("JSX css prop at line {:?}", jsx_elem.span.lo);
                                    
                                    self.state.css_expressions_to_resolve.push(CssExpressionToResolve {
                                        id,
                                        expression: (**expr).clone(),
                                        location,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        // Recursively check children
        for child in &jsx_elem.children {
            if let JSXElementChild::JSXElement(child_elem) = child {
                self.collect_css_expressions_from_jsx_element(child_elem);
            }
        }
    }
}

/// Convert a JSON value from the bundler to a SWC expression
fn json_value_to_expr(value: &serde_json::Value) -> Option<Expr> {
    use swc_core::common::DUMMY_SP;
    
    match value {
        serde_json::Value::String(s) => Some(Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: s.clone().into(),
            raw: None,
        }))),
        serde_json::Value::Number(n) => {
            if let Some(f) = n.as_f64() {
                Some(Expr::Lit(Lit::Num(Number {
                    span: DUMMY_SP,
                    value: f,
                    raw: None,
                })))
            } else {
                None
            }
        }
        serde_json::Value::Bool(b) => Some(Expr::Lit(Lit::Bool(Bool {
            span: DUMMY_SP,
            value: *b,
        }))),
        serde_json::Value::Object(obj) => {
            let mut props = Vec::new();
            for (key, value) in obj {
                if let Some(value_expr) = json_value_to_expr(value) {
                    props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                        key: PropName::Ident(Ident::new(key.clone().into(), DUMMY_SP)),
                        value: Box::new(value_expr),
                    }))));
                }
            }
            Some(Expr::Object(ObjectLit {
                span: DUMMY_SP,
                props,
            }))
        }
        serde_json::Value::Array(arr) => {
            let mut elems = Vec::new();
            for value in arr {
                if let Some(value_expr) = json_value_to_expr(value) {
                    elems.push(Some(ExprOrSpread {
                        spread: None,
                        expr: Box::new(value_expr),
                    }));
                }
            }
            Some(Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems,
            }))
        }
        serde_json::Value::Null => Some(Expr::Lit(Lit::Null(Null {
            span: DUMMY_SP,
        }))),
    }
}

impl CompiledTransform {
    /// Resolve all collected import expressions (called after first pass)
    fn resolve_import_expressions(&mut self) {
        // Clone the expressions to resolve to avoid borrowing conflicts
        let expressions_to_resolve: Vec<_> = self.state.css_expressions_to_resolve.drain(..).collect();
        
        for css_expr in expressions_to_resolve {
            if let Some(resolved) = self.resolve_expression_imports(css_expr.expression) {
                self.state.resolved_expressions.insert(css_expr.id, resolved);
            }
        }
    }
}

impl VisitMut for CompiledTransform {
    fn visit_mut_program(&mut self, n: &mut Program) {
        // Initialize transformation state 
        if let Program::Module(module) = n {
            // Process imports and pragmas first
            self.process_imports_and_pragmas(module);
            // Collect CSS expressions that need resolution
            self.collect_css_expressions_pass(n);
            
            // Resolve import expressions
            self.resolve_import_expressions();
        }
        
        // Continue with normal transformation
        n.visit_mut_children_with(self);
    }

    fn visit_mut_module(&mut self, n: &mut Module) {
        // First pass: Check for JSX pragmas and compiled imports
        self.process_imports_and_pragmas(n);
        
        // Second pass: Process child nodes for transformations
        n.visit_mut_children_with(self);
        
        // Finalize the module
        self.finalize_module(n);
    }

    fn visit_mut_call_expr(&mut self, n: &mut CallExpr) {
        // Handle different types of call expressions
        if visitors::styled::visit_styled_call_expr(n, &mut self.state, &mut self.collected_css_sheets) {
            self.had_transformations = true;
        } else if visitors::css_map::visit_css_map_call_expr(n, &mut self.state, &mut self.collected_css_sheets) {
            self.had_transformations = true;
        } else if visitors::keyframes::visit_keyframes_call_expr(n, &mut self.state, &mut self.collected_css_sheets) {
            self.had_transformations = true;
        } else if visitors::css_prop::visit_jsx_call_expr(n, &mut self.state, &mut self.collected_css_sheets) {
            self.had_transformations = true;
        }
        
        n.visit_mut_children_with(self);
    }
    
    fn visit_mut_tagged_tpl(&mut self, n: &mut TaggedTpl) {
        // Handle different types of tagged templates
        if visitors::styled::visit_styled_tagged_template(n, &mut self.state, &mut self.collected_css_sheets) {
            self.had_transformations = true;
        } else if visitors::keyframes::visit_keyframes_tagged_template(n, &mut self.state) {
            self.had_transformations = true;
        }
        
        n.visit_mut_children_with(self);
    }
    
    fn visit_mut_jsx_element(&mut self, n: &mut JSXElement) {
        // Process ClassNames components first
        if visitors::class_names::visit_class_names_jsx_element(n, &mut self.state, &mut self.collected_css_sheets) {
            self.had_transformations = true;
        }
        // Process CSS props in JSX elements
        else if visitors::css_prop::visit_css_prop_jsx_opening_element(&mut n.opening, &mut self.state, &mut self.collected_css_sheets) {
            self.had_transformations = true;
        }
        
        n.visit_mut_children_with(self);
    }

    fn visit_mut_var_declarator(&mut self, n: &mut VarDeclarator) {
        // Track local variables before visiting children
        if let Pat::Ident(ident) = &n.name {
            if let Some(init_expr) = &n.init {
                let var_name = ident.id.sym.to_string();
                self.track_local_variable(&var_name, init_expr);
            }
        }
        
        n.visit_mut_children_with(self);
        
        // Post-process keyframes and CSS map call expressions to fix format
        if let Some(init_expr) = &mut n.init {
            self.fix_keyframes_calls(&mut **init_expr);
            self.fix_css_map_calls(&mut **init_expr);
        }
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
        state,
        had_transformations: false,
    };
    
    program.fold_with(&mut as_folder(&mut transform))
}
