
use std::collections::{HashMap, HashSet};
use crate::utils::module_resolver::{ModuleResolver, ExportValue};
use crate::utils::variable_context::VariableContext;
use swc_core::ecma::ast::*;

/// Information about a CSS expression that needs import resolution
#[derive(Debug, Clone)]
pub struct CssExpressionToResolve {
    /// Unique identifier for this expression
    pub id: String,
    /// The expression that needs resolution
    pub expression: swc_core::ecma::ast::Expr,
    /// Location info for debugging
    pub location: String,
}

/// State for tracking transformations during the plugin pass
#[derive(Debug, Clone)]
pub struct TransformState {
    /// Boolean turned true if the compiled module import is found
    pub compiled_imports: Option<CompiledImports>,
    
    /// Whether xcss is used in this module
    pub uses_xcss: bool,
    
    /// Details of pragmas that are currently enabled
    pub pragma: PragmaState,
    
    /// Files that have been included in this transformation
    pub included_files: Vec<String>,
    
    /// Holds a record of currently hoisted sheets in the module
    pub sheets: HashMap<String, Ident>,
    
    /// Holds a record of evaluated cssMap() calls
    pub css_map: HashMap<String, Vec<String>>,
    
    /// Holdings a record of member expression names to ignore
    pub ignore_member_expressions: HashMap<String, bool>,
    
    /// Modules that expose APIs to be compiled by Compiled
    pub import_sources: Vec<String>,
    
    /// Module resolver for handling imports from external files
    pub module_resolver: Option<ModuleResolver>,
    
    /// External imports (non-@compiled/react imports) that need to be resolved
    pub external_imports: HashMap<String, String>, // local_name -> import_path
    
    /// Resolved expressions cache for CSS transformation
    pub resolved_expressions: HashMap<String, swc_core::ecma::ast::Expr>,
    
    /// CSS expressions that need import resolution (collected in first pass)
    pub css_expressions_to_resolve: Vec<CssExpressionToResolve>,
    
    /// Local variables in the current scope (for static analysis)
    pub local_variables: HashMap<String, ExportValue>,
    
    /// Variable declaration kinds (let, const, var) for let variable detection
    pub variable_declaration_kinds: HashMap<String, VarDeclKind>,
    
    /// Variables that have been actually mutated (assigned to after declaration)
    pub mutated_variables: HashSet<String>,
    
    /// Variable context for expression evaluation
    pub variable_context: VariableContext,
    
    /// Debug messages to inject into the output JS
    pub debug_messages: Vec<String>,
}

/// Details of imports from Compiled modules
#[derive(Debug, Clone)]
pub struct CompiledImports {
    pub class_names: Option<Vec<String>>,
    pub css: Option<Vec<String>>,
    pub keyframes: Option<Vec<String>>,
    pub styled: Option<Vec<String>>,
    pub css_map: Option<Vec<String>>,
}

/// Pragma state for JSX transformations
#[derive(Debug, Clone, Default)]
pub struct PragmaState {
    pub jsx: bool,
    pub jsx_import_source: bool,
    pub classic_jsx_pragma_is_compiled: bool,
    pub classic_jsx_pragma_local_name: Option<String>,
}

/// Information about a styled component tag
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct Tag {
    /// Name of the component
    pub name: String,
    /// Type of the component - built-in or user-defined
    pub component_type: ComponentType,
}

/// Type of component
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum ComponentType {
    InBuiltComponent,
    UserDefinedComponent,
}

/// Context for CSS transformations
#[derive(Debug, Clone)]
pub enum TransformContext {
    Root,
    Keyframes { keyframe: String },
    Fragment,
}

/// Result of a transformation
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct TransformResult {
    /// Files that have been included in this transformation
    pub included_files: Vec<String>,
    /// Transformed code
    pub code: Option<String>,
}

/// CSS rule representation
#[derive(Debug, Clone)]
pub struct CssRule {
    pub selector: String,
    pub declarations: Vec<CssDeclaration>,
}

/// CSS declaration representation
#[derive(Debug, Clone)]
pub struct CssDeclaration {
    pub property: String,
    pub value: String,
    pub important: bool,
}

/// Metadata for CSS transformations
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct CssMetadata {
    pub context: TransformContext,
    pub state: TransformState,
}

impl Default for TransformState {
    fn default() -> Self {
        Self {
            compiled_imports: None,
            uses_xcss: false,
            pragma: PragmaState::default(),
            included_files: Vec::new(),
            sheets: HashMap::new(),
            css_map: HashMap::new(),
            ignore_member_expressions: HashMap::new(),
            import_sources: vec![
                "@compiled/react".to_string(),
                "compiled-react".to_string(),
                "@atlaskit/css".to_string(),
            ],
            module_resolver: None,
            external_imports: HashMap::new(),
            resolved_expressions: HashMap::new(),
            css_expressions_to_resolve: Vec::new(),
            local_variables: HashMap::new(),
            variable_declaration_kinds: HashMap::new(),
            mutated_variables: HashSet::new(),
            variable_context: VariableContext::new(),
            debug_messages: Vec::new(),
        }
    }
}

impl CompiledImports {
    pub fn new() -> Self {
        Self {
            class_names: None,
            css: None,
            keyframes: None,
            styled: None,
            css_map: None,
        }
    }
}

/// Represents different types of CSS items
#[derive(Debug, Clone)]
pub enum CssItem {
    Unconditional { css: String },
    Conditional { css: String, condition: Expr },
    // TODO: Add more types like Logical, Map as needed
}

/// CSS output containing processed styles and metadata
#[derive(Debug, Clone)]
pub struct CSSOutput {
    pub css: Vec<CssItem>,
    pub variables: Vec<Variable>,
    pub class_name: String,
    pub css_text: String,
}

#[derive(Debug, Clone)]
pub struct AtomicCSSOutput {
    pub class_names: Vec<String>,
    pub css_sheets: Vec<(String, String)>, // (class_name, css_rule)
}

/// Represents a CSS variable
#[derive(Debug, Clone)]
pub struct Variable {
    pub name: String,
    pub expression: Expr,
    pub suffix: Option<String>,
    pub prefix: Option<String>,
}