use ahash::AHashMap as HashMap;
use swc_core::ecma::ast::Expr;

#[derive(Debug, Clone)]
pub struct TransformState {
	pub compiled_imports: Option<CompiledImports>,
	pub import_sources: Vec<String>,
	pub css_map: HashMap<String, HashMap<String, CssMapVariantInfo>>, // ident -> variant -> info
	pub css_classes_by_ident: HashMap<String, CssInfo>, // identifier -> classes + sheet var names
    pub const_bindings: HashMap<String, Box<Expr>>, // local const identifier -> initializer expr (Object/Array/String/etc.)
    pub keyframes_by_ident: HashMap<String, KeyframesInfo>, // identifier -> generated keyframes info
}

#[derive(Debug, Clone)]
pub struct CompiledImports {
	pub css: Option<Vec<String>>,   // local names for css
	pub css_map: Option<Vec<String>>, // local names for cssMap
	pub styled: Option<Vec<String>>, // local names for styled
    pub keyframes: Option<Vec<String>>, // local names for keyframes
}

impl CompiledImports {
	pub fn new() -> Self {
		Self { css: None, css_map: None, styled: None, keyframes: None }
	}
}

#[derive(Debug, Clone)]
pub struct CssInfo {
	pub class_names: Vec<String>,
	pub sheet_var_names: Vec<String>,
}

impl Default for TransformState {
	fn default() -> Self {
		Self {
			compiled_imports: None,
			import_sources: vec!["@compiled/react".to_string(), "@atlaskit/css".to_string()],
			css_map: HashMap::new(),
			css_classes_by_ident: HashMap::new(),
            const_bindings: HashMap::new(),
            keyframes_by_ident: HashMap::new(),
		}
	}
}

#[derive(Debug, Clone)]
pub struct CssMapVariantInfo {
	pub class_names: Vec<String>,
	pub sheet_var_names: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct KeyframesInfo {
    pub name: String,
    pub sheet_var_name: Option<String>,
    pub var_assignments: Vec<KeyframeVarSpec>,
}

#[derive(Debug, Clone)]
pub struct KeyframeVarSpec {
    pub var_name: String,
    pub value_expr: Box<Expr>,
    pub suffix: Option<String>,
    pub prefix: Option<String>,
}

