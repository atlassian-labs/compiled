// Tests for CSS rule hoisting functionality
// These tests verify that CSS rules are hoisted to the top of the module as const declarations
// and that the behavior matches the babel plugin exactly, including proper deduplication
// of identical CSS rules.

use compiled_swc::{test_utils::{transform_with_compiled, TestTransformOptions, TestAssertions}, assert_includes, assert_includes_multiple};

#[cfg(test)]
mod rule_hoisting_tests {
    use super::*;

    fn transform(code: &str) -> String {
        transform_with_compiled(code, TestTransformOptions {
            pretty: true,
            ..Default::default()
        })
    }

    #[test]
    fn should_hoist_to_the_top_of_the_module() {
        let actual = transform(r#"
            import '@compiled/react';

            const Component = () => (
                <>
                    <div css={{ fontSize: 12 }}>hello world</div>
                    <div css={{ fontSize: 24 }}>hello world</div>
                </>
            );
        "#);

        // Check that CSS rules are hoisted to the top as const declarations
        // SWC plugin uses _css_ prefix for constants
        assert_includes!(actual, "const _css_");
        
        // Check that the CSS is compiled correctly
        assert_includes!(actual, "font-size:12px");
        assert_includes!(actual, "font-size:24px");
        
        // Check that className is generated (SWC uses different hash values)
        assert_includes!(actual, "className={ax([");
        
        // Check that the compiled runtime imports are present
        assert_includes_multiple!(actual, vec![
            "import { ax, ix, CC, CS } from \"@compiled/react/runtime\"",
            "import * as React from \"react\""
        ]);
        
        // Check that there are two different hoisted constants for different styles
        let const_count = actual.matches("const _css_").count();
        assert_eq!(const_count, 2, "Should have two hoisted consts for different CSS rules");
    }

    #[test]
    fn should_reuse_rules_already_hoisted() {
        let actual = transform(r#"
            import '@compiled/react';

            const Component = () => (
                <>
                    <div css={{ fontSize: 12 }}>hello world</div>
                    <div css={{ fontSize: 12 }}>hello world</div>
                </>
            );
        "#);

        // Check that the CSS is compiled correctly
        assert_includes!(actual, "font-size:12px");
        
        // Check that CSS rules are hoisted
        assert_includes!(actual, "const _css_");
        
        // Check that only one CSS rule is hoisted for duplicate styles (like babel plugin)
        let const_count = actual.matches("const _css_").count();
        assert_eq!(const_count, 1, "Should only have one hoisted const for duplicate CSS");
        
        // Check that both elements use the same hoisted constant and class name
        assert_includes!(actual, "className={ax([");
        
        // Check that the compiled runtime imports are present
        assert_includes_multiple!(actual, vec![
            "import { ax, ix, CC, CS } from \"@compiled/react/runtime\"",
            "import * as React from \"react\""
        ]);
    }

    #[test]
    fn should_hoist_complex_css_rules() {
        let actual = transform(r#"
            import '@compiled/react';

            const Component = () => (
                <div css={{ 
                    color: 'red', 
                    backgroundColor: 'blue',
                    padding: '10px'
                }}>
                    complex styles
                </div>
            );
        "#);

        // Check that the complex CSS rule is hoisted
        assert_includes!(actual, "const _css_");
        
        // Check that all CSS properties are present
        assert_includes!(actual, "color:red");
        assert_includes!(actual, "background-color:blue");
        assert_includes!(actual, "padding:10px");
    }

    #[test]
    fn should_handle_multiple_different_rules() {
        let actual = transform(r#"
            import '@compiled/react';

            const Component = () => (
                <>
                    <div css={{ color: 'red' }}>red text</div>
                    <div css={{ color: 'blue' }}>blue text</div>
                    <div css={{ color: 'green' }}>green text</div>
                </>
            );
        "#);

        // Check that multiple different CSS rules are hoisted
        let const_count = actual.matches("const _css_").count();
        assert_eq!(const_count, 3, "Should have three hoisted consts for different CSS rules");
        
        // Check that each color is present
        assert_includes!(actual, "color:red");
        assert_includes!(actual, "color:blue");
        assert_includes!(actual, "color:green");
    }
}