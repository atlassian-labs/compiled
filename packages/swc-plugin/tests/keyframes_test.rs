use compiled_swc::{test_utils::{transform_with_compiled, TestTransformOptions, TestAssertions}, assert_includes_multiple};

#[cfg(test)]
mod keyframes_tests {
    use super::*;

    fn transform(code: &str) -> String {
        transform_with_compiled(code, TestTransformOptions {
            pretty: true,
            ..Default::default()
        })
    }

    fn transform_snippet(code: &str) -> String {
        transform_with_compiled(code, TestTransformOptions {
            snippet: true,
            pretty: true,
            ..Default::default()
        })
    }

    #[test]
    fn should_transform_keyframes_with_object_call_expression() {
        let actual = transform_snippet(r#"
            import { keyframes } from '@compiled/react';

            const fadeOut = keyframes({
                'from, 25%': {
                    opacity: 1,
                },
                '25%': {
                    opacity: 0.75,
                },
                '50%': {
                    opacity: 0.5,
                },
                to: {
                    opacity: 0,
                },
            });
        "#);

        assert_includes_multiple!(actual, vec![
            "@keyframes",
            "from, 25%",
            "opacity:1",
            "25%",
            "opacity:0.75",
            "50%",
            "opacity:0.5",
            "to",
            "opacity:0",
        ]);
    }

    #[test]
    fn should_transform_keyframes_with_tagged_template_literal() {
        let actual = transform_snippet(r#"
            import { keyframes } from '@compiled/react';

            const slideIn = keyframes`
                from {
                    transform: translateX(-100%);
                }
                to {
                    transform: translateX(0);
                }
            `;
        "#);

        // SWC generates @keyframes with proper whitespace formatting
        assert_includes_multiple!(actual, vec![
            "@keyframes",
            "from",
            "translateX(-100%)",
            "to", 
            "translateX(0)",
        ]);
    }

    #[test]
    fn should_use_keyframes_in_css_prop() {
        let actual = transform(r#"
            import { keyframes } from '@compiled/react';

            const fadeIn = keyframes({
                from: { opacity: 0 },
                to: { opacity: 1 },
            });

            <div css={{
                animation: `${fadeIn} 2s ease-in-out`,
            }} />
        "#);

        assert_includes_multiple!(actual, vec![
            "@keyframes",
            "opacity:0",
            "opacity:1",
            "animation:",
            // Should reference the keyframes by name
        ]);
    }

    #[test]
    fn should_use_keyframes_in_styled_component() {
        let actual = transform_snippet(r#"
            import { styled, keyframes } from '@compiled/react';

            const bounce = keyframes`
                0%, 20%, 53%, 80%, to {
                    transform: translate3d(0,0,0);
                }
                40%, 43% {
                    transform: translate3d(0, -30px, 0);
                }
                70% {
                    transform: translate3d(0, -15px, 0);
                }
                90% {
                    transform: translate3d(0, -4px, 0);
                }
            `;

            const BouncyDiv = styled.div`
                animation: ${bounce} 1s ease infinite;
            `;
        "#);

        // SWC generates @keyframes with proper whitespace formatting
        assert_includes_multiple!(actual, vec![
            "@keyframes",
            "0%, 20%, 53%, 80%, to",
            "translate3d(0,0,0)",
            "40%, 43%",
            "translate3d(0, -30px, 0)",
            "70%",
            "translate3d(0, -15px, 0)",
            "90%",
            "translate3d(0, -4px, 0)",
        ]);
    }

    #[test]
    fn should_handle_multiple_keyframes() {
        let actual = transform_snippet(r#"
            import { keyframes } from '@compiled/react';

            const fadeOut = keyframes({
                from: { opacity: 1 },
                to: { opacity: 0 },
            });

            const slideUp = keyframes({
                from: { transform: 'translateY(100%)' },
                to: { transform: 'translateY(0)' },
            });

            <div css={{
                animation: `${fadeOut} 2s ease-in-out, ${slideUp} 1s ease-out`,
            }} />
        "#);

        assert_includes_multiple!(actual, vec![
            "@keyframes",
            "opacity:1",
            "opacity:0", 
            "transform:translateY(100%)",
            "transform:translateY(0)",
            "animation:",
        ]);
    }

    #[test]
    fn should_handle_keyframes_with_vendor_prefixes() {
        let actual = transform_snippet(r#"
            import { keyframes } from '@compiled/react';

            const spin = keyframes`
                from {
                    -webkit-transform: rotate(0deg);
                    -moz-transform: rotate(0deg);
                    transform: rotate(0deg);
                }
                to {
                    -webkit-transform: rotate(360deg);
                    -moz-transform: rotate(360deg);
                    transform: rotate(360deg);
                }
            `;
        "#);

        // SWC generates @keyframes with proper whitespace formatting
        assert_includes_multiple!(actual, vec![
            "@keyframes",
            "-webkit-transform: rotate(0deg)",
            "-moz-transform: rotate(0deg)",
            "transform: rotate(0deg)",
            "-webkit-transform: rotate(360deg)",
            "-moz-transform: rotate(360deg)", 
            "transform: rotate(360deg)",
        ]);
    }

    #[test]

    fn should_handle_keyframes_with_percentage_keyframes() {
        let actual = transform_snippet(r#"
            import { keyframes } from '@compiled/react';

            const complexAnimation = keyframes({
                '0%': {
                    opacity: 0,
                    transform: 'scale(0.8)',
                },
                '50%': {
                    opacity: 0.5,
                    transform: 'scale(1.1)',
                },
                '100%': {
                    opacity: 1,
                    transform: 'scale(1)',
                },
            });
        "#);

        assert_includes_multiple!(actual, vec![
            "@keyframes",
            "0%",
            "opacity:0",
            "transform:scale(0.8)",
            "50%",
            "opacity:0.5",
            "transform:scale(1.1)",
            "100%",
            "opacity:1",
            "transform:scale(1)",
        ]);
    }

    #[test]
    fn should_handle_keyframes_with_expressions() {
        let actual = transform_snippet(r#"
            import { keyframes } from '@compiled/react';

            const startOpacity = 0;
            const endOpacity = 1;

            const fadeIn = keyframes({
                from: { opacity: startOpacity },
                to: { opacity: endOpacity },
            });
        "#);

        assert_includes_multiple!(actual, vec![
            "@keyframes",
            "opacity:0",
            "opacity:1",
        ]);
    }

    #[test]

    fn should_handle_keyframes_with_nested_objects() {
        let actual = transform_snippet(r#"
            import { keyframes } from '@compiled/react';

            const pulseAnimation = keyframes({
                '0%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 0 0 rgba(255, 82, 82, 0.7)',
                },
                '70%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 0 10px rgba(255, 82, 82, 0)',
                },
                '100%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 0 0 rgba(255, 82, 82, 0)',
                },
            });
        "#);

        assert_includes_multiple!(actual, vec![
            "@keyframes",
            "0%",
            "transform:scale(1)",
            "box-shadow:0 0 0 0 rgba(255, 82, 82, 0.7)",
            "70%",
            "box-shadow:0 0 0 10px rgba(255, 82, 82, 0)",
            "100%",
            "box-shadow:0 0 0 0 rgba(255, 82, 82, 0)",
        ]);
    }

    #[test]

    fn should_generate_unique_keyframe_names() {
        let actual = transform_snippet(r#"
            import { keyframes } from '@compiled/react';

            const animation1 = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
            const animation2 = keyframes({ from: { opacity: 1 }, to: { opacity: 0 } });
        "#);

        // Should generate unique names for each keyframes declaration
        let keyframe_count = actual.matches("@keyframes").count();
        assert_eq!(keyframe_count, 2);
    }

    #[test]
    fn should_handle_keyframes_in_conditional_expressions() {
        let actual = transform_snippet(r#"
            import { keyframes } from '@compiled/react';

            const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
            const fadeOut = keyframes({ from: { opacity: 1 }, to: { opacity: 0 } });

            const isVisible = true;

            <div css={{
                animation: `${isVisible ? fadeIn : fadeOut} 1s ease`,
            }} />
        "#);

        assert_includes_multiple!(actual, vec![
            "@keyframes",
            "opacity:0",
            "opacity:1",
            // Dynamic animation selection should use CSS variables
            "var(--",
        ]);
    }
}