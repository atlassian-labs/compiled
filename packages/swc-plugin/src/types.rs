use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct TransformState {
    pub compiled_imports: Option<CompiledImports>,
    
    pub uses_xcss: bool,
    
    pub import_sources: Vec<String>,
    
    pub css_map: HashMap<String, Vec<String>>,
    
    pub transform_cache: HashMap<usize, bool>,
}

#[derive(Debug, Clone)]
pub struct CompiledImports {
    pub css: Option<Vec<String>>,
    pub css_map: Option<Vec<String>>,
    pub styled: Option<Vec<String>>,
}

impl CompiledImports {
    pub fn new() -> Self {
        Self {
            css: None,
            css_map: None,
            styled: None,
        }
    }
}

impl Default for TransformState {
    fn default() -> Self {
        Self {
            compiled_imports: None,
            uses_xcss: false,
            import_sources: vec![
                "@compiled/react".to_string(),
                "@atlaskit/css".to_string(),
            ],
            css_map: HashMap::new(),
            transform_cache: HashMap::new(),
        }
    }
}

// Removed unused types
