//! Module resolution system for compile-time static analysis of JavaScript/TypeScript modules.
//! 
//! This module provides functionality to resolve import paths and extract static values
//! from JavaScript, TypeScript, and JSON files at compile time. It supports:
//! 
//! - ES6 module exports (`export const`, `export default`)
//! - CommonJS exports (`module.exports`)
//! - JSON files
//! - Simple object literals and primitives
//! 
//! # Usage
//! 
//! ```rust
//! use compiled_swc::utils::module_resolver::ModuleResolver;
//! 
//! let mut resolver = ModuleResolver::new("src");
//! 
//! // Resolve an export from a module
//! if let Some(export) = resolver.get_export("./colors", "primary") {
//!     println!("Primary color: {:?}", export);
//! }
//! ```
//! 
//! # Limitations
//! 
//! - Only supports static values that can be determined at compile time
//! - Complex JavaScript expressions are not evaluated
//! - Dynamic imports are not supported
//! - Function bodies are not analyzed (only return objects for simple cases)

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use swc_core::ecma::ast::*;
use swc_core::common::DUMMY_SP;

/// A production-ready module resolver for compile-time static analysis.
/// 
/// This resolver uses WASI filesystem access to read and parse JavaScript, TypeScript,
/// and JSON files, extracting static exports that can be used during CSS-in-JS compilation.
/// 
/// # Features
/// 
/// - **Caching**: Parsed modules are cached to avoid re-parsing the same file
/// - **Multiple formats**: Supports ES6 exports, CommonJS, and JSON
/// - **Type safety**: All exports are strongly typed through the `ExportValue` enum
/// - **WASI integration**: Uses WebAssembly System Interface for secure file access
/// 
/// # Thread Safety
/// 
/// This resolver is not thread-safe due to internal mutable state (cache).
/// Create separate instances for concurrent use.
#[derive(Debug, Clone)]
pub struct ModuleResolver {
    /// Cache of resolved modules to avoid re-parsing
    pub module_cache: HashMap<String, ModuleInfo>,
    /// Base directory for relative path resolution
    pub base_dir: PathBuf,
}

/// Information about a resolved module including its exports and metadata.
/// 
/// This structure contains all the statically analyzable exports from a JavaScript,
/// TypeScript, or JSON module that was successfully parsed.
/// 
/// # Examples
/// 
/// ```rust
/// // For a file like: export const primary = "red"; export default "blue";
/// // This would contain:
/// // exports: {"primary": ExportValue::String("red")}
/// // default_export: Some(ExportValue::String("blue"))
/// ```
#[derive(Debug, Clone)]
pub struct ModuleInfo {
    /// All named exports from the module (e.g., `export const name = value`)
    pub exports: HashMap<String, ExportValue>,
    /// The default export if present (e.g., `export default value`)
    pub default_export: Option<ExportValue>,
}

/// Represents different types of export values that can be statically resolved at compile time.
/// 
/// This enum covers the most common static values found in JavaScript modules that are
/// useful for CSS-in-JS compilation. Complex expressions that cannot be statically
/// analyzed are represented as `Dynamic`.
/// 
/// # Examples
/// 
/// ```rust
/// use compiled_swc::utils::module_resolver::ExportValue;
/// 
/// // String: export const color = "red"
/// let color = ExportValue::String("red".to_string());
/// 
/// // Number: export const size = 16
/// let size = ExportValue::Number(16.0);
/// 
/// // Object: export const theme = { primary: "blue", secondary: "green" }
/// let mut theme_obj = std::collections::HashMap::new();
/// theme_obj.insert("primary".to_string(), ExportValue::String("blue".to_string()));
/// let theme = ExportValue::Object(theme_obj);
/// ```
#[derive(Debug, Clone)]
pub enum ExportValue {
    /// Static string literal (e.g., `"red"`, `'#ff0000'`)
    String(String),
    /// Static number literal (e.g., `16`, `1.5`, `-10`)
    Number(f64),
    /// Static boolean literal (e.g., `true`, `false`)
    Boolean(bool),
    /// Static object with known properties (e.g., `{ color: "red", size: 16 }`)
    /// Limited to simple nested structures
    Object(HashMap<String, ExportValue>),
    /// Function that returns a static object (limited analysis)
    /// Contains the static return value rather than the function itself
    Function(HashMap<String, ExportValue>),
    /// Unresolvable value that requires runtime evaluation
    /// Used for complex expressions, variables, or dynamic content
    Dynamic,
}

impl ModuleResolver {
    /// Creates a new module resolver with the specified base directory.
    /// 
    /// The base directory is used to resolve relative import paths. All relative
    /// paths will be resolved against this base directory when converted to
    /// absolute WASI filesystem paths.
    /// 
    /// # Arguments
    /// 
    /// * `base_dir` - The base directory path for resolving relative imports
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// let resolver = ModuleResolver::new("src/components");
    /// // Relative imports like "./colors" will be resolved as "src/components/colors"
    /// ```
    pub fn new<P: AsRef<Path>>(base_dir: P) -> Self {
        Self {
            module_cache: HashMap::new(),
            base_dir: base_dir.as_ref().to_path_buf(),
        }
    }

    /// Resolves a module import and returns cached module information.
    /// 
    /// This method attempts to locate and parse the specified module, returning
    /// its exports and metadata. Results are cached to avoid re-parsing the same
    /// module multiple times.
    /// 
    /// # Arguments
    /// 
    /// * `import_path` - The import path (relative or absolute) to resolve
    /// 
    /// # Returns
    /// 
    /// * `Some(&ModuleInfo)` - If the module was successfully located and parsed
    /// * `None` - If the module could not be found or parsed
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// let mut resolver = ModuleResolver::new("src");
    /// 
    /// // Resolve a relative import
    /// if let Some(module) = resolver.resolve_module("./colors") {
    ///     println!("Module has {} exports", module.exports.len());
    /// }
    /// 
    /// // Resolve an absolute import
    /// if let Some(module) = resolver.resolve_module("/shared/theme") {
    ///     println!("Found shared theme module");
    /// }
    /// ```
    pub fn resolve_module(&mut self, import_path: &str) -> Option<&ModuleInfo> {
        // If already cached, return cached version
        if self.module_cache.contains_key(import_path) {
            return self.module_cache.get(import_path);
        }

        // Try to resolve and load the actual file via WASI filesystem access
        let resolved_path = self.resolve_path(import_path);
        let module_info = if let Some(file_path) = resolved_path {
            // Try to load and parse the actual file
            self.load_and_parse_file(&file_path, import_path)
        } else {
            None
        };
        
        // File loading failed - no fallback in production
        let module_info = module_info;
        
        if let Some(info) = module_info {
            self.module_cache.insert(import_path.to_string(), info);
            self.module_cache.get(import_path)
        } else {
            None
        }
    }



    /// Resolve a file path using WASI filesystem access
    fn resolve_path(&self, import_path: &str) -> Option<PathBuf> {
        use std::path::{Path, PathBuf};
        
        // Convert import path to use /cwd/ prefix for WASI filesystem access
        let import = Path::new(import_path);
        let resolved = if import.is_absolute() {
            // For absolute paths, prefix with /cwd/
            PathBuf::from(format!("/cwd{}", import_path))
        } else {
            // For relative paths, resolve against /cwd/ + base directory
            let cwd_base = PathBuf::from("/cwd").join(&self.base_dir);
            cwd_base.join(import)
        };
        
        // Try different extensions
        for ext in &[".js", ".ts", ".jsx", ".tsx", ".json"] {
            let path_with_ext = resolved.with_extension(&ext[1..]);
            
            if path_with_ext.exists() {
                return Some(path_with_ext);
            }
        }
        
        // Try the original path without extension
        if resolved.exists() {
            return Some(resolved);
        }
        
        None
    }

    /// Load and parse a file using WASI filesystem access
    fn load_and_parse_file(&self, file_path: &PathBuf, _import_path: &str) -> Option<ModuleInfo> {
        match std::fs::read_to_string(file_path) {
            Ok(content) => {
                // Parse the file content
                if let Some(exports) = self.parse_file_content(&content, file_path) {
                    let default_export = exports.get("default").cloned();
                    return Some(ModuleInfo { exports, default_export });
                }
            }
            Err(_) => {
                // File read failed - this is expected for missing files
            }
        }
        
        None
    }
    
    /// Parse file content and extract exports
    fn parse_file_content(&self, content: &str, file_path: &PathBuf) -> Option<HashMap<String, ExportValue>> {
        let mut exports = HashMap::new();
        let file_name = file_path.to_string_lossy();
        
        // Handle JSON files
        if file_name.ends_with(".json") {
            if let Ok(json_value) = serde_json::from_str::<serde_json::Value>(content) {
                if let serde_json::Value::Object(obj) = json_value {
                    for (key, value) in obj {
                        let export_value = match value {
                            serde_json::Value::String(s) => ExportValue::String(s),
                            serde_json::Value::Number(n) => {
                                if let Some(f) = n.as_f64() {
                                    ExportValue::Number(f)
                                } else {
                                    ExportValue::Dynamic
                                }
                            }
                            serde_json::Value::Bool(b) => ExportValue::Boolean(b),
                            _ => ExportValue::Dynamic,
                        };
                        exports.insert(key, export_value);
                    }
                }
                return Some(exports);
            }
        }
        
        // Parse JavaScript/TypeScript exports using regex patterns
        
        // Match: export const name = "value" or export const name = 'value'
        if let Ok(const_export_regex) = regex::Regex::new(r#"export\s+const\s+(\w+)\s*=\s*['"]([^'"]+)['"]"#) {
            for caps in const_export_regex.captures_iter(content) {
                if let (Some(name), Some(value)) = (caps.get(1), caps.get(2)) {
                    exports.insert(name.as_str().to_string(), ExportValue::String(value.as_str().to_string()));
                }
            }
        }
        
        // Match: export const name = 123 (numbers)
        if let Ok(number_export_regex) = regex::Regex::new(r#"export\s+const\s+(\w+)\s*=\s*(\d+(?:\.\d+)?)"#) {
            for caps in number_export_regex.captures_iter(content) {
                if let (Some(name), Some(value)) = (caps.get(1), caps.get(2)) {
                    if let Ok(num) = value.as_str().parse::<f64>() {
                        exports.insert(name.as_str().to_string(), ExportValue::Number(num));
                    }
                }
            }
        }
        
        // Match: export const name = true/false (booleans)
        if let Ok(bool_export_regex) = regex::Regex::new(r#"export\s+const\s+(\w+)\s*=\s*(true|false)"#) {
            for caps in bool_export_regex.captures_iter(content) {
                if let (Some(name), Some(value)) = (caps.get(1), caps.get(2)) {
                    if let Ok(bool_val) = value.as_str().parse::<bool>() {
                        exports.insert(name.as_str().to_string(), ExportValue::Boolean(bool_val));
                    }
                }
            }
        }
        
        // Match: export const name = { ... } (simple objects)
        if let Ok(object_export_regex) = regex::Regex::new(r#"export\s+const\s+(\w+)\s*=\s*\{([^}]+)\}"#) {
            for caps in object_export_regex.captures_iter(content) {
                if let (Some(name), Some(obj_content)) = (caps.get(1), caps.get(2)) {
                    let mut obj_exports = HashMap::new();
                    
                    // Parse simple key: value pairs inside the object
                    if let Ok(prop_regex) = regex::Regex::new(r#"(\w+)\s*:\s*['"]([^'"]+)['"]"#) {
                        for prop_caps in prop_regex.captures_iter(obj_content.as_str()) {
                            if let (Some(key), Some(value)) = (prop_caps.get(1), prop_caps.get(2)) {
                                obj_exports.insert(key.as_str().to_string(), ExportValue::String(value.as_str().to_string()));
                            }
                        }
                    }
                    
                    // Parse number properties
                    if let Ok(num_prop_regex) = regex::Regex::new(r#"(\w+)\s*:\s*(\d+(?:\.\d+)?)"#) {
                        for prop_caps in num_prop_regex.captures_iter(obj_content.as_str()) {
                            if let (Some(key), Some(value)) = (prop_caps.get(1), prop_caps.get(2)) {
                                if let Ok(num) = value.as_str().parse::<f64>() {
                                    obj_exports.insert(key.as_str().to_string(), ExportValue::Number(num));
                                }
                            }
                        }
                    }
                    
                    if !obj_exports.is_empty() {
                        exports.insert(name.as_str().to_string(), ExportValue::Object(obj_exports));
                    }
                }
            }
        }
        
        // Match: export default "value" or export default 123
        if let Ok(default_string_regex) = regex::Regex::new(r#"export\s+default\s+["']([^"']+)["']"#) {
            if let Some(caps) = default_string_regex.captures(content) {
                if let Some(value) = caps.get(1) {
                    exports.insert("default".to_string(), ExportValue::String(value.as_str().to_string()));
                }
            }
        }
        
        if let Ok(default_number_regex) = regex::Regex::new(r#"export\s+default\s+(\d+(?:\.\d+)?)"#) {
            if let Some(caps) = default_number_regex.captures(content) {
                if let Some(value) = caps.get(1) {
                    if let Ok(num) = value.as_str().parse::<f64>() {
                        exports.insert("default".to_string(), ExportValue::Number(num));
                    }
                }
            }
        }
        
        // Match: module.exports = { ... } (CommonJS)
        if let Ok(commonjs_regex) = regex::Regex::new(r#"module\.exports\s*=\s*\{([^}]+)\}"#) {
            if let Some(caps) = commonjs_regex.captures(content) {
                if let Some(obj_content) = caps.get(1) {
                    // Parse properties in CommonJS exports
                    if let Ok(prop_regex) = regex::Regex::new(r#"(\w+)\s*:\s*['"]([^'"]+)['"]"#) {
                        for prop_caps in prop_regex.captures_iter(obj_content.as_str()) {
                            if let (Some(key), Some(value)) = (prop_caps.get(1), prop_caps.get(2)) {
                                exports.insert(key.as_str().to_string(), ExportValue::String(value.as_str().to_string()));
                            }
                        }
                    }
                }
            }
        }
        
        if exports.is_empty() {
            None
        } else {
            Some(exports)
        }
    }



    /// Retrieves a specific named export from a module.
    /// 
    /// This is a convenience method that combines module resolution with export lookup.
    /// It will first resolve the module (using cache if available) and then search
    /// for the specified export name.
    /// 
    /// # Arguments
    /// 
    /// * `import_path` - The path to the module containing the export
    /// * `export_name` - The name of the export to retrieve
    /// 
    /// # Returns
    /// 
    /// * `Some(&ExportValue)` - If the module and export were both found
    /// * `None` - If the module couldn't be resolved or the export doesn't exist
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// let mut resolver = ModuleResolver::new("src");
    /// 
    /// // Get a named export: export const primaryColor = "red"
    /// if let Some(ExportValue::String(color)) = resolver.get_export("./theme", "primaryColor") {
    ///     println!("Primary color is: {}", color);
    /// }
    /// 
    /// // Handle missing exports gracefully
    /// match resolver.get_export("./config", "apiKey") {
    ///     Some(value) => println!("API key found: {:?}", value),
    ///     None => println!("API key not configured"),
    /// }
    /// ```
    pub fn get_export(&mut self, import_path: &str, export_name: &str) -> Option<&ExportValue> {
        let module_info = self.resolve_module(import_path)?;
        module_info.exports.get(export_name)
    }

    /// Retrieves the default export from a module.
    /// 
    /// This method resolves the module and returns its default export if present.
    /// Default exports are typically declared with `export default value` in ES6
    /// modules.
    /// 
    /// # Arguments
    /// 
    /// * `import_path` - The path to the module
    /// 
    /// # Returns
    /// 
    /// * `Some(&ExportValue)` - If the module has a default export
    /// * `None` - If the module has no default export or couldn't be resolved
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// let mut resolver = ModuleResolver::new("src");
    /// 
    /// // Get default export: export default { theme: "dark" }
    /// if let Some(ExportValue::Object(config)) = resolver.get_default_export("./config") {
    ///     println!("Default config loaded with {} properties", config.len());
    /// }
    /// ```
    pub fn get_default_export(&mut self, import_path: &str) -> Option<&ExportValue> {
        let module_info = self.resolve_module(import_path)?;
        module_info.default_export.as_ref()
    }
    

}

impl ExportValue {
    /// Converts an `ExportValue` to a SWC AST expression node.
    /// 
    /// This method transforms statically resolved values into SWC expression nodes
    /// that can be inserted into the generated JavaScript code. This is essential
    /// for compile-time CSS-in-JS transformations where imported values need to
    /// be inlined into the output.
    /// 
    /// # Returns
    /// 
    /// * `Some(Expr)` - If the value can be represented as a static expression
    /// * `None` - If the value is `Dynamic` and cannot be statically resolved
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// use compiled_swc::utils::module_resolver::ExportValue;
    /// 
    /// // String becomes string literal
    /// let color = ExportValue::String("red".to_string());
    /// let expr = color.to_expr(); // Results in Expr::Lit(Lit::Str(...))
    /// 
    /// // Number becomes numeric literal
    /// let size = ExportValue::Number(16.0);
    /// let expr = size.to_expr(); // Results in Expr::Lit(Lit::Num(...))
    /// 
    /// // Dynamic values cannot be converted
    /// let dynamic = ExportValue::Dynamic;
    /// assert!(dynamic.to_expr().is_none());
    /// ```
    pub fn to_expr(&self) -> Option<Expr> {
        match self {
            ExportValue::String(s) => Some(Expr::Lit(Lit::Str(Str {
                span: DUMMY_SP,
                value: s.clone().into(),
                raw: None,
            }))),
            ExportValue::Number(n) => Some(Expr::Lit(Lit::Num(Number {
                span: DUMMY_SP,
                value: *n,
                raw: None,
            }))),
            ExportValue::Boolean(b) => Some(Expr::Lit(Lit::Bool(Bool {
                span: DUMMY_SP,
                value: *b,
            }))),
            ExportValue::Object(obj) => {
                let mut props = Vec::new();
                for (key, value) in obj {
                    if let Some(value_expr) = value.to_expr() {
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
            ExportValue::Function(result) => {
                // For function calls, return the result object
                result.get("return").and_then(|v| v.to_expr()).or_else(|| {
                    // If no explicit return, treat the whole map as the return value
                    let mut props = Vec::new();
                    for (key, value) in result {
                        if let Some(value_expr) = value.to_expr() {
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
                })
            }
            ExportValue::Dynamic => None,
        }
    }

    /// Determines if this export value can be statically resolved at compile time.
    /// 
    /// This method returns `true` for all export values except `Dynamic`, indicating
    /// whether the value can be safely inlined during compilation without requiring
    /// runtime evaluation.
    /// 
    /// # Returns
    /// 
    /// * `true` - If the value is static and can be resolved at compile time
    /// * `false` - If the value is dynamic and requires runtime evaluation
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// use compiled_swc::utils::module_resolver::ExportValue;
    /// 
    /// assert!(ExportValue::String("red".to_string()).is_static());
    /// assert!(ExportValue::Number(42.0).is_static());
    /// assert!(ExportValue::Boolean(true).is_static());
    /// assert!(!ExportValue::Dynamic.is_static());
    /// ```
    /// 
    /// This is particularly useful when deciding whether to inline a value
    /// during CSS-in-JS compilation or to leave it as a dynamic reference.
    pub fn is_static(&self) -> bool {
        !matches!(self, ExportValue::Dynamic)
    }
}

