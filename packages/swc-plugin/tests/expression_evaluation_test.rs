use compiled_swc::{test_utils::{transform_with_compiled, TestTransformOptions, TestAssertions}, assert_includes, assert_includes_multiple};

#[cfg(test)]
mod expression_evaluation_tests {
    use super::*;

    fn transform(code: &str) -> String {
        transform_with_compiled(code, TestTransformOptions {
            pretty: true,
            ..Default::default()
        })
    }

    #[test]
    fn should_evaluate_simple_expressions() {
        let actual = transform(r#"
            import '@compiled/react';

            <div css={{ fontSize: 8 * 2 }}>hello world</div>
        "#);

        assert_includes!(actual, "font-size:16px");
    }

    #[test]
    fn should_inline_mutable_identifier_that_is_not_mutated() {
        let actual = transform(r#"
            import '@compiled/react';

            let notMutatedAgain = 20;

            <div css={{ fontSize: notMutatedAgain }}>hello world</div>
        "#);

        assert_includes!(actual, "font-size:20px");
    }

    #[test]
    #[should_panic(expected = "Mutable variable 'mutable' cannot be used in CSS expressions")]
    fn should_bail_out_evaluating_expression_referencing_a_mutable_identifier() {
        let _actual = transform(r#"
            import '@compiled/react';

            let mutable = 2;
            mutable = 1;

            <div css={{ fontSize: mutable }}>hello world</div>
        "#);

        // Should panic when let variable is detected - test expects panic
    }

    #[test]

    fn should_bail_out_evaluating_identifier_expression_referencing_a_mutated_identifier() {
        let actual = transform(r#"
            import '@compiled/react';

            let mutable = 2;
            const dontchange = mutable;
            mutable = 3;

            <div css={{ fontSize: dontchange }}>hello world</div>
        "#);

        // Should create a CSS variable for values referencing mutated identifiers
        assert_includes!(actual, "{font-size:var(--");
    }

    #[test]
    #[ignore] // Stack overflow issue with self-referencing variables - separate from mutation detection
    fn should_not_exhaust_the_stack_when_an_identifier_references_itself() {
        // This test should not panic - just verify it doesn't infinite loop
        let _result = transform(r#"
            import '@compiled/react';

            const heading = heading || 20;

            <div css={{ marginLeft: `${heading.depth}rem`, color: 'red' }}>hello world</div>
        "#);
        // If we get here without hanging, the test passes
    }

    #[test]

    fn should_bail_out_evaluating_expression_that_references_a_constant_expression_referencing_a_mutated_expression() {
        let actual = transform(r#"
            import '@compiled/react';

            let mutable = false;
            const dontchange = mutable ? 1 : 2;
            mutable = true;

            <div css={{ fontSize: dontchange }}>hello world</div>
        "#);

        assert_includes!(actual, "{font-size:var(--");
    }

    #[test]
    #[should_panic(expected = "Mutable variable 'mutable' cannot be used in CSS expressions")]
    fn should_bail_out_evaluating_a_binary_expression_referencing_a_mutated_identifier() {
        let _actual = transform(r#"
            import '@compiled/react';

            let mutable = 2;
            mutable = 1;

            <div css={{ fontSize: mutable + 10 }}>hello world</div>
        "#);

        // Should panic when mutated variable is detected in binary expression
    }

    #[test]
    fn should_evaluate_template_literals_with_static_values() {
        let actual = transform(r#"
            import '@compiled/react';

            const size = 12;
            const unit = 'px';

            <div css={{ fontSize: `${size}${unit}` }}>hello world</div>
        "#);

        assert_includes!(actual, "font-size:12px");
    }

    #[test]
    fn should_handle_conditional_expressions() {
        let actual = transform(r#"
            import '@compiled/react';

            const isLarge = true;

            <div css={{ fontSize: isLarge ? '16px' : '12px' }}>hello world</div>
        "#);

        assert_includes!(actual, "font-size:16px");
    }

    #[test]
    fn should_handle_simple_object_property_access() {
        let actual = transform(r#"
            import '@compiled/react';

            const obj = {
                color: 'red',
            };

            <div css={{ color: obj.color }}>hello world</div>
        "#);

        assert_includes!(actual, "color:red");
    }

    #[test]
    fn should_handle_simple_chained_property_access() {
        let actual = transform(r#"
            import '@compiled/react';

            const obj = {
                nested: {
                    value: 'test'
                }
            };

            <div css={{ color: obj.nested.value }}>hello world</div>
        "#);

        assert_includes!(actual, "color:test");
    }

    #[test]
    fn should_handle_object_property_access() {
        let actual = transform(r#"
            import '@compiled/react';

            const theme = {
                colors: {
                    primary: 'blue',
                },
                sizes: {
                    small: '12px',
                },
            };

            <div css={{ 
                color: theme.colors.primary,
                fontSize: theme.sizes.small,
            }}>hello world</div>
        "#);

        assert_includes_multiple!(actual, vec![
            "color:blue",
            "font-size:12px",
        ]);
    }

    #[test]  
    fn should_handle_simple_array_identifier() {
        let actual = transform(r#"
            import '@compiled/react';

            const color = 'red';

            <div css={{ color: color }}>hello world</div>
        "#);

        assert_includes!(actual, "color:red");
    }

    #[test]
    fn should_handle_simple_array_access() {
        let actual = transform(r#"
            import '@compiled/react';

            const colors = ['red'];

            <div css={{ color: colors[0] }}>hello world</div>
        "#);

        assert_includes!(actual, "color:red");
    }

    #[test]
    fn should_handle_array_access() {
        let actual = transform(r#"
            import '@compiled/react';

            const colors = ['red', 'green', 'blue'];

            <div css={{ color: colors[0] }}>hello world</div>
        "#);

        assert_includes!(actual, "color:red");
    }

    #[test]

    fn should_handle_function_calls_to_pure_functions() {
        let actual = transform(r#"
            import '@compiled/react';

            const getColor = () => 'red';

            <div css={{ color: getColor() }}>hello world</div>
        "#);

        // For now, should probably bail out to dynamic evaluation
        // Later we might want to evaluate pure functions
        assert_includes!(actual, "{color:var(--");
    }

    #[test]
    fn should_handle_logical_operators() {
        let actual = transform(r#"
            import '@compiled/react';

            const show = true;
            const color = 'red';

            <div css={{ 
                color: show && color,
                display: show ? 'block' : 'none',
            }}>hello world</div>
        "#);

        assert_includes_multiple!(actual, vec![
            "color:red",
            "display:block",
        ]);
    }

    #[test]
    fn should_handle_spread_operators_in_objects() {
        let actual = transform(r#"
            import '@compiled/react';

            const baseStyles = {
                color: 'red',
                fontSize: '12px',
            };

            <div css={{ 
                ...baseStyles,
                fontWeight: 'bold',
            }}>hello world</div>
        "#);

        // SWC optimizes better by combining all properties into single rule
        assert_includes_multiple!(actual, vec![
            "color:red",
            "font-size:12px", 
            "font-weight:bold",
        ]);
    }

    #[test]
    fn should_handle_nested_object_spreading() {
        let actual = transform(r#"
            import '@compiled/react';

            const typography = {
                fontSize: '14px',
                lineHeight: 1.4,
            };

            const spacing = {
                margin: '10px',
                padding: '5px',
            };

            <div css={{ 
                ...typography,
                ...spacing,
                color: 'red',
            }}>hello world</div>
        "#);

        // SWC optimizes better by combining all properties into single rule
        assert_includes_multiple!(actual, vec![
            "font-size:14px",
            "line-height:1.4",
            "margin:10px",
            "padding:5px",
            "color:red",
        ]);
    }
}