use compiled_swc::{test_utils::{transform_with_compiled, TestTransformOptions, TestAssertions}, assert_includes_multiple};

#[cfg(test)]
mod css_map_tests {
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
    fn should_transform_basic_css_map() {
        let actual = transform_snippet(r#"
            import { cssMap } from '@compiled/react';

            const styles = cssMap({
                primary: { color: 'blue' },
                secondary: { color: 'gray' },
            });
        "#);

        assert_includes_multiple!(actual, vec![
            "const styles = {",
            "primary:",
            "secondary:",
            "color:blue",
            "color:gray",
        ]);
    }

    #[test]
    fn should_use_css_map_in_css_prop() {
        let actual = transform(r#"
            import { cssMap } from '@compiled/react';

            const styles = cssMap({
                danger: { backgroundColor: 'red' },
                success: { backgroundColor: 'green' },
            });

            <div css={styles.danger} />
        "#);

        assert_includes_multiple!(actual, vec![
            "background-color:red",
            "background-color:green",
            "className={ax([",
            "styles.danger",
        ]);
    }

    #[test]
    fn should_handle_css_map_with_complex_styles() {
        let actual = transform_snippet(r#"
            import { cssMap } from '@compiled/react';

            const buttonStyles = cssMap({
                base: {
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                },
                primary: {
                    backgroundColor: 'blue',
                    color: 'white',
                },
                secondary: {
                    backgroundColor: 'gray',
                    color: 'black',
                },
                large: {
                    padding: '12px 24px',
                    fontSize: '18px',
                },
            });
        "#);

        assert_includes_multiple!(actual, vec![
            "base:",
            "primary:",
            "secondary:",
            "large:",
            "padding:8px 16px",
            "border:none",
            "border-radius:4px",
            "cursor:pointer",
            "background-color:blue",
            "color:white",
            "background-color:gray",
            "color:black",
            "padding:12px 24px",
            "font-size:18px",
        ]);
    }

    #[test]

    fn should_handle_css_map_with_pseudo_selectors() {
        let actual = transform_snippet(r#"
            import { cssMap } from '@compiled/react';

            const linkStyles = cssMap({
                default: {
                    color: 'blue',
                    textDecoration: 'none',
                    ':hover': {
                        textDecoration: 'underline',
                    },
                    ':visited': {
                        color: 'purple',
                    },
                },
                button: {
                    appearance: 'none',
                    ':focus': {
                        outline: '2px solid blue',
                    },
                },
            });
        "#);

        assert_includes_multiple!(actual, vec![
            "default:",
            "button:",
            "color:blue",
            "text-decoration:none",
            ":hover",
            "text-decoration:underline",
            ":visited",
            "color:purple",
            "appearance:none",
            ":focus",
            "outline:2px solid blue",
        ]);
    }

    #[test]

    fn should_handle_css_map_with_media_queries() {
        let actual = transform_snippet(r#"
            import { cssMap } from '@compiled/react';

            const responsiveStyles = cssMap({
                container: {
                    width: '100%',
                    '@media (min-width: 768px)': {
                        width: '50%',
                    },
                    '@media (min-width: 1024px)': {
                        width: '33%',
                    },
                },
                text: {
                    fontSize: '14px',
                    '@media (min-width: 768px)': {
                        fontSize: '16px',
                    },
                },
            });
        "#);

        assert_includes_multiple!(actual, vec![
            "container:",
            "text:",
            "width:100%",
            "@media (min-width: 768px)",
            "width:50%",
            "@media (min-width: 1024px)",
            "width:33%",
            "font-size:14px",
            "font-size:16px",
        ]);
    }

    #[test]

    fn should_handle_css_map_with_dynamic_access() {
        let actual = transform(r#"
            import { cssMap } from '@compiled/react';

            const alertStyles = cssMap({
                info: { backgroundColor: 'lightblue' },
                warning: { backgroundColor: 'orange' },
                error: { backgroundColor: 'red' },
            });

            const type = 'warning';

            <div css={alertStyles[type]} />
        "#);

        assert_includes_multiple!(actual, vec![
            "background-color:lightblue",
            "background-color:orange",
            "background-color:red",
        ]);
    }

    #[test]

    fn should_handle_css_map_with_array_composition() {
        let actual = transform(r#"
            import { cssMap } from '@compiled/react';

            const styles = cssMap({
                base: { padding: '10px' },
                theme: { color: 'blue' },
            });

            <div css={[styles.base, styles.theme]} />
        "#);

        assert_includes_multiple!(actual, vec![
            "padding:10px",
            "color:blue",
            "styles.base",
            "styles.theme",
        ]);
    }

    #[test]

    fn should_handle_css_map_with_conditional_styles() {
        let actual = transform(r#"
            import { cssMap } from '@compiled/react';

            const buttonStyles = cssMap({
                base: {
                    padding: '8px 16px',
                    border: 'none',
                },
                primary: {
                    backgroundColor: 'blue',
                    color: 'white',
                },
                disabled: {
                    opacity: 0.5,
                    cursor: 'not-allowed',
                },
            });

            const isPrimary = true;
            const isDisabled = false;

            <button css={[
                buttonStyles.base,
                isPrimary && buttonStyles.primary,
                isDisabled && buttonStyles.disabled,
            ]}>
                Click me
            </button>
        "#);

        assert_includes_multiple!(actual, vec![
            "padding:8px 16px",
            "border:none",
            "background-color:blue",
            "color:white",
            "opacity:0.5",
            "cursor:not-allowed",
        ]);
    }

    #[test]

    fn should_handle_css_map_with_object_spread() {
        let actual = transform(r#"
            import { cssMap } from '@compiled/react';

            const baseStyles = cssMap({
                container: {
                    display: 'flex',
                    alignItems: 'center',
                },
            });

            <div css={{
                ...baseStyles.container,
                justifyContent: 'center',
            }} />
        "#);

        assert_includes_multiple!(actual, vec![
            "display:flex",
            "align-items:center",
            "justify-content:center",
        ]);
    }

    #[test]

    fn should_handle_nested_css_maps() {
        let actual = transform_snippet(r#"
            import { cssMap } from '@compiled/react';

            const themeStyles = cssMap({
                light: {
                    backgroundColor: 'white',
                    color: 'black',
                },
                dark: {
                    backgroundColor: 'black',
                    color: 'white',
                },
            });

            const componentStyles = cssMap({
                button: {
                    padding: '10px',
                    border: 'none',
                },
                input: {
                    padding: '8px',
                    border: '1px solid gray',
                },
            });
        "#);

        assert_includes_multiple!(actual, vec![
            "const themeStyles = {",
            "const componentStyles = {",
            "light:",
            "dark:",
            "button:",
            "input:",
            "background-color:white",
            "color:black",
            "background-color:black",
            "color:white",
            "padding:10px",
            "border:none",
            "padding:8px",
            "border:1px solid gray",
        ]);
    }

    #[test]

    fn should_handle_css_map_with_keyframes() {
        let actual = transform_snippet(r#"
            import { cssMap, keyframes } from '@compiled/react';

            const slideIn = keyframes({
                from: { transform: 'translateX(-100%)' },
                to: { transform: 'translateX(0)' },
            });

            const animationStyles = cssMap({
                slide: {
                    animation: `${slideIn} 0.3s ease-in-out`,
                },
                fade: {
                    transition: 'opacity 0.3s ease',
                },
            });
        "#);

        assert_includes_multiple!(actual, vec![
            "@keyframes",
            "transform:translateX(-100%)",
            "transform:translateX(0)",
            "slide:",
            "fade:",
            "animation:",
            "transition:opacity 0.3s ease",
        ]);
    }

    #[test]

    fn should_handle_css_map_with_variable_references() {
        let actual = transform_snippet(r#"
            import { cssMap } from '@compiled/react';

            const primaryColor = 'blue';
            const spacing = 16;

            const styles = cssMap({
                primary: {
                    color: primaryColor,
                    padding: `${spacing}px`,
                },
                secondary: {
                    color: 'gray',
                    padding: `${spacing / 2}px`,
                },
            });
        "#);

        assert_includes_multiple!(actual, vec![
            "primary:",
            "secondary:",
            "color:var(",
            "padding:var(",
            "color:gray",
        ]);
    }
}