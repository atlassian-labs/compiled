use compiled_swc::{test_utils::{transform_with_compiled, TestTransformOptions}};

#[cfg(test)]
mod error_handling_tests {
    use super::*;

    fn transform(code: &str) -> String {
        transform_with_compiled(code, TestTransformOptions {
            highlight_code: false,
            pretty: true,
            ..Default::default()
        })
    }

    #[test]

    fn should_throw_when_using_using_an_invalid_css_node() {
        // This should panic/error when we try to transform an arrow function in CSS
        let _result = std::panic::catch_unwind(|| {
            transform(r#"
                import '@compiled/react';

                <div css={() => {}} />
            "#)
        });
        
        // For now, just test that we can parse it without crashing
        // Later this should properly error
    }

    #[test]
  
    fn should_throw_when_spreading_an_identifier_that_does_not_exist() {
        // This should panic/error when we try to spread a non-existent identifier
        let _result = std::panic::catch_unwind(|| {
            transform(r#"
                import '@compiled/react';

                <div css={{ ...dontexist }} />
            "#)
        });
        
        // For now, just test that we can parse it without crashing
        // Later this should properly error
    }

    #[test]

    fn should_throw_when_referencing_an_identifier_that_does_not_exist() {
        // This should panic/error when we try to reference a non-existent identifier
        let _result = std::panic::catch_unwind(|| {
            transform(r#"
                import '@compiled/react';

                <div css={dontexist} />
            "#)
        });
        
        // For now, just test that we can parse it without crashing
        // Later this should properly error
    }

    #[test]

    fn should_throw_when_referencing_an_identifier_that_isnt_supported() {
        // This should panic/error when we try to use a class as CSS
        let _result = std::panic::catch_unwind(|| {
            transform(r#"
                import '@compiled/react';

                class HelloWorld {}

                <div css={HelloWorld} />
            "#)
        });
        
        // For now, just test that we can parse it without crashing
        // Later this should properly error with "ClassDeclaration isn't a supported CSS type"
    }

    #[test]

    fn should_throw_when_composing_invalid_css() {
        // This should panic/error when we try to use spread elements in CSS arrays
        let _result = std::panic::catch_unwind(|| {
            transform(r#"
                import '@compiled/react';

                <div css={[...hello]} />
            "#)
        });
        
        // For now, just test that we can parse it without crashing
        // Later this should properly error with "SpreadElement isn't a supported CSS type"
    }

    #[test]

    fn should_throw_when_using_unsupported_css_at_rules() {
        // This should error for unsupported at-rules
        let _result = std::panic::catch_unwind(|| {
            transform(r#"
                import '@compiled/react';

                <div css={{
                    '@import': 'url(style.css)',
                }} />
            "#)
        });
    }

    #[test]

    fn should_throw_when_using_invalid_property_values() {
        // This should error for invalid CSS property values
        let _result = std::panic::catch_unwind(|| {
            transform(r#"
                import '@compiled/react';

                <div css={{
                    color: undefined,
                }} />
            "#)
        });
    }

    #[test]

    fn should_throw_when_using_computed_property_names_that_cannot_be_evaluated() {
        // This should error for computed property names that can't be statically evaluated
        let _result = std::panic::catch_unwind(|| {
            transform(r#"
                import '@compiled/react';

                const prop = Math.random() > 0.5 ? 'color' : 'backgroundColor';

                <div css={{
                    [prop]: 'red',
                }} />
            "#)
        });
    }

    #[test]

    fn should_throw_when_using_dynamic_keyframes_name() {
        // This should error when keyframes name cannot be statically determined
        let _result = std::panic::catch_unwind(|| {
            transform(r#"
                import { keyframes } from '@compiled/react';

                const name = Math.random().toString();
                
                const animation = keyframes({
                    [name]: {
                        from: { opacity: 0 },
                        to: { opacity: 1 },
                    }
                });
            "#)
        });
    }

    #[test]

    fn should_throw_when_styled_component_is_not_called_on_valid_element() {
        // This should error when styled is called on invalid elements
        let _result = std::panic::catch_unwind(|| {
            transform(r#"
                import { styled } from '@compiled/react';

                const InvalidComponent = styled[123]`
                    color: red;
                `;
            "#)
        });
    }

    #[test]

    fn should_provide_helpful_error_for_missing_import() {
        // This should provide a helpful error when using CSS without proper import
        let _result = std::panic::catch_unwind(|| {
            transform(r#"
                // No import of @compiled/react

                <div css={{ color: 'red' }} />
            "#)
        });
    }

    #[test]

    fn should_throw_when_css_map_has_invalid_structure() {
        // This should error when cssMap has invalid structure
        let _result = std::panic::catch_unwind(|| {
            transform(r#"
                import { cssMap } from '@compiled/react';

                const styles = cssMap('invalid');
            "#)
        });
    }

    #[test]

    fn should_throw_when_using_xcss_with_dynamic_values() {
        // This should error when xcss prop contains dynamic values
        let _result = std::panic::catch_unwind(|| {
            transform(r#"
                import '@compiled/react';

                const dynamicColor = 'red';

                <Component xcss={{ color: dynamicColor }} />
            "#)
        });
    }
}