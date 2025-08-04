use compiled_swc::test_utils::{transform_with_compiled, TestTransformOptions};

macro_rules! assert_includes {
    ($result:expr, $expected:expr) => {
        if !$result.contains($expected) {
            panic!("Expected result to include '{}', but got: {}", $expected, $result);
        }
    };
}

#[cfg(test)]
mod react_createElement_tests {
    use super::*;

    #[test]
    fn should_transform_react_create_element_with_css_prop() {
        let code = r#"
            import '@compiled/react';
            
            const Button = () => React.createElement("button", {
                css: { color: 'red', padding: '8px' }
            }, "Click me");
        "#;
        
        let result = transform_with_compiled(code, TestTransformOptions::default());
        
        // Should transform css prop to className with ax()
        assert_includes!(result, "className");
        assert_includes!(result, "ax([");
        assert_includes!(result, "_");
        
        // Should generate CSS constants
        assert_includes!(result, "const _");
        assert_includes!(result, "color: red");
        assert_includes!(result, "padding:");
        
        // Should add runtime imports
        assert_includes!(result, "@compiled/react/runtime");
        assert_includes!(result, "ax");
        
        // Should NOT contain the original css prop
        assert!(!result.contains("css: {"));
        
        println!("Transformed React.createElement result:");
        println!("{}", result);
    }

    #[test]
    #[ignore] // String CSS in React.createElement not yet implemented - feature planned for future release
    fn should_handle_react_create_element_with_string_css() {
        let code = r#"
            import '@compiled/react';
            
            const Button = () => React.createElement("button", {
                css: "color: blue; font-size: 16px;"
            }, "Click me");
        "#;
        
        let result = transform_with_compiled(code, TestTransformOptions::default());
        
        // Should transform css prop to className
        assert_includes!(result, "className");
        assert_includes!(result, "ax([");
        
        // Should generate CSS constants
        assert_includes!(result, "color: blue");
        assert_includes!(result, "font-size: 16px");
        
        println!("String CSS result:");
        println!("{}", result);
    }

    #[test]
    fn should_handle_member_expression_react_create_element() {
        let code = r#"
            import * as React from 'react';
            import '@compiled/react';
            
            const Button = () => React.createElement("button", {
                css: { backgroundColor: 'green' }
            }, "Click me");
        "#;
        
        let result = transform_with_compiled(code, TestTransformOptions::default());
        
        // Should transform css prop
        assert_includes!(result, "className");
        assert_includes!(result, "ax([");
        assert_includes!(result, "background-color: green");
        
        println!("Member expression result:");
        println!("{}", result);
    }

    #[test]
    fn should_preserve_other_props_when_transforming_css() {
        let code = r#"
            import '@compiled/react';
            
            const Button = () => React.createElement("button", {
                css: { color: 'red' },
                onClick: handleClick,
                disabled: true
            }, "Click me");
        "#;
        
        let result = transform_with_compiled(code, TestTransformOptions::default());
        
        // Should transform css prop
        assert_includes!(result, "className");
        assert_includes!(result, "ax([");
        
        // Should preserve other props
        assert_includes!(result, "onClick: handleClick");
        assert_includes!(result, "disabled: true");
        
        // Should NOT contain css prop
        assert!(!result.contains("css: {"));
        
        println!("Mixed props result:");
        println!("{}", result);
    }

    #[test]
    fn should_transform_exact_browser_test_case() {
        // This is the EXACT input from the browser compatibility test
        let code = r#"
import '@compiled/react';

const Button = () => (
  <button css={{ color: 'red', padding: '8px' }}>
    Click me
  </button>
);
        "#;
        
        let result = transform_with_compiled(code, TestTransformOptions::default());
        
        println!("=== EXACT BROWSER TEST CASE ===");
        println!("Input:");
        println!("{}", code);
        println!("Output:");
        println!("{}", result);
        println!("================================");
        
        // Should transform css prop to className
        assert_includes!(result, "className");
        assert_includes!(result, "ax([");
        
        // Should generate CSS constants
        assert_includes!(result, "const _");
        
        // Should add runtime imports
        assert_includes!(result, "@compiled/react/runtime");
        
        // Should NOT contain the original css prop
        assert!(!result.contains("css: {"));
    }
}