use swc_core::{
    common::{FilePathMapping},
    ecma::{
        codegen::{text_writer::JsWriter, Emitter},
        parser::{lexer::Lexer, Parser, StringInput, Syntax, TsSyntax},
        visit::{as_folder, FoldWith},
    },
};
use std::sync::Arc;

use crate::{CompiledOptions, CompiledTransform};

/// Options for test transformations that mirror the babel plugin test options
#[derive(Debug, Clone)]
pub struct TestTransformOptions {
    pub filename: Option<String>,
    pub comments: bool,
    pub pretty: bool,
    pub snippet: bool,
    pub import_react: bool,
    pub import_sources: Vec<String>,
    pub optimize_css: bool,
    pub highlight_code: bool,
    pub compiled_options: CompiledOptions,
}

impl Default for TestTransformOptions {
    fn default() -> Self {
        Self {
            filename: None,
            comments: false,
            pretty: false,
            snippet: false,
            import_react: true,
            import_sources: vec!["@compiled/react".to_string()],
            optimize_css: true,
            highlight_code: false,
            compiled_options: CompiledOptions::default(),
        }
    }
}

/// Custom assertion trait for better test ergonomics
pub trait TestAssertions {
    fn to_include(&self, expected: &str) -> bool;
    fn to_include_multiple(&self, expected: Vec<&str>) -> bool;
    fn to_not_include(&self, unexpected: &str) -> bool;
}

impl TestAssertions for String {
    fn to_include(&self, expected: &str) -> bool {
        self.contains(expected)
    }
    
    fn to_include_multiple(&self, expected: Vec<&str>) -> bool {
        expected.iter().all(|exp| self.contains(exp))
    }
    
    fn to_not_include(&self, unexpected: &str) -> bool {
        !self.contains(unexpected)
    }
}

/// Transform code using our SWC plugin for testing
pub fn transform_with_compiled(code: &str, options: TestTransformOptions) -> String {
    let syntax = Syntax::Typescript(TsSyntax {
        tsx: true,
        decorators: false,
        dts: false,
        no_early_errors: false,
        disallow_ambiguous_jsx_like: false,
    });

    // Create a dummy file
    let fm = swc_core::common::SourceMap::new(FilePathMapping::empty())
        .new_source_file(
            if let Some(filename) = &options.filename {
                swc_core::common::FileName::Real(filename.clone().into())
            } else {
                swc_core::common::FileName::Anon
            },
            code.to_string(),
        );

    // Parse the code
    let lexer = Lexer::new(syntax, Default::default(), StringInput::from(&*fm), None);
    let mut parser = Parser::new_from(lexer);
    
    let module = parser
        .parse_module()
        .map_err(|e| {

            e
        })
        .expect("Failed to parse module");

    // Configure plugin options based on test options
    let mut compiled_opts = options.compiled_options.clone();
    compiled_opts.import_react = options.import_react;
    compiled_opts.import_sources = options.import_sources.clone();
    compiled_opts.optimize_css = options.optimize_css;
    compiled_opts.filename = options.filename.clone();

    // Initialize state
    let mut state = crate::types::TransformState::default();
    state.import_sources = compiled_opts.import_sources.clone();
    
    // Build variable context from the module
    state.variable_context = crate::utils::variable_context::build_variable_context_from_module(&module);

    // Apply our Compiled transformation
    let transformed = module
        .fold_with(&mut as_folder(CompiledTransform {
            options: compiled_opts,
            collected_css_sheets: Vec::new(),
            state,
            had_transformations: false,
        }));

    // Generate code
    let mut buf = Vec::new();
    {
        let writer = JsWriter::new(
            Arc::new(swc_core::common::SourceMap::new(FilePathMapping::empty())),
            "\n",
            &mut buf,
            None,
        );
        let mut emitter = Emitter {
            cfg: swc_core::ecma::codegen::Config::default(),
            cm: Arc::new(swc_core::common::SourceMap::new(FilePathMapping::empty())),
            comments: None,
            wr: writer,
        };
        emitter.emit_module(&transformed).unwrap();
    }

    let mut result = String::from_utf8(buf).unwrap();
    
    // Handle snippet option - similar to babel plugin test utils
    if options.snippet {
        if let Some(if_index) = result.find("if (process.env.NODE_ENV") {
            // Remove the imports from the code, and the styled components display name
            if let Some(const_index) = result.find("const") {
                result = result[const_index..if_index].trim().to_string();
            }
        } else if let Some(const_index) = result.find("const") {
            result = result[const_index..].trim().to_string();
        }
    }
    
    result
}

/// Helper macro for easy test assertion 
#[macro_export]
macro_rules! assert_includes {
    ($result:expr, $expected:expr) => {
        assert!($result.to_include($expected), 
            "Expected result to include '{}', but got:\n{}", 
            $expected, $result);
    };
}

#[macro_export]
macro_rules! assert_includes_multiple {
    ($result:expr, $expected:expr) => {
        assert!($result.to_include_multiple($expected), 
            "Expected result to include all of {:?}, but got:\n{}", 
            $expected, $result);
    };
}

#[macro_export]
macro_rules! assert_not_includes {
    ($result:expr, $unexpected:expr) => {
        assert!($result.to_not_include($unexpected), 
            "Expected result to NOT include '{}', but got:\n{}", 
            $unexpected, $result);
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transform_utility_works() {
        let code = "const one = 1;";
        let result = transform_with_compiled(code, TestTransformOptions::default());
        assert!(result.contains("const one = 1"));
    }
}