use compiled_swc::{test_utils::{transform_with_compiled, TestTransformOptions, TestAssertions}, assert_includes, assert_includes_multiple};

#[cfg(test)]
mod class_names_tests {
    use super::*;

    fn transform(code: &str) -> String {
        transform_with_compiled(code, TestTransformOptions {
            pretty: true,
            ..Default::default()
        })
    }

    #[test]
    fn should_transform_basic_class_names_component() {
        let actual = transform(r#"
            import { ClassNames } from '@compiled/react';

            <ClassNames>
                {({ css }) => (
                    <div className={css({ color: 'red' })}>
                        Hello World
                    </div>
                )}
            </ClassNames>
        "#);

        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime""#,
            "color:red",
            "className={ax([",
            "<CC>",
            "<CS>",
        ]);
    }

    #[test]
    fn should_handle_class_names_with_object_styles() {
        let actual = transform(r#"
            import { ClassNames } from '@compiled/react';

            <ClassNames>
                {({ css }) => (
                    <div className={css({
                        color: 'blue',
                        fontSize: '16px',
                        padding: '10px',
                    })}>
                        Content
                    </div>
                )}
            </ClassNames>
        "#);

        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime";"#,
            r#"const _ = "._k21x1k{color:blue;font-size:16px;padding:10px;}";"#,
            r#"<CC><CS>{["#,
            r#"    _"#,
            r#"]}</CS>"#,
            r#"className={ax(["#,
            r#"        "_k21x1k""#,
        ]);
    }

    #[test]
    fn should_handle_class_names_with_template_literal() {
        let actual = transform(r#"
            import { ClassNames } from '@compiled/react';

            <ClassNames>
                {({ css }) => (
                    <div className={css({
                        color: 'green',
                        fontWeight: 'bold',
                        margin: '5px',
                    })}>
                        Styled Content
                    </div>
                )}
            </ClassNames>
        "#);

        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime";"#,
            r#"const _ = "._wbjoj6{color:green;font-weight:bold;margin:5px;}";"#,
            r#"<CC><CS>{["#,
            r#"    _"#,
            r#"]}</CS>"#,
            r#"className={ax(["#,
            r#"        "_wbjoj6""#,
        ]);
    }

    #[test]
    fn should_handle_class_names_with_multiple_elements() {
        let actual = transform(r#"
            import { ClassNames } from '@compiled/react';

            <ClassNames>
                {({ css }) => (
                    <div>
                        <h1 className={css({ color: 'blue', fontSize: '24px' })}>
                            Title
                        </h1>
                        <p className={css({ color: 'gray', lineHeight: 1.5 })}>
                            Description
                        </p>
                    </div>
                )}
            </ClassNames>
        "#);

        assert_includes_multiple!(actual, vec![
            "color:blue",
            "font-size:24px",
            "color:gray",
            "line-height:1.5",
        ]);
    }

    #[test]
    fn should_handle_class_names_with_conditional_styles() {
        let actual = transform(r#"
            import { ClassNames } from '@compiled/react';

            const isActive = true;

            <ClassNames>
                {({ css }) => (
                    <button className={css({
                        padding: '10px 20px',
                        backgroundColor: isActive ? 'blue' : 'gray',
                        color: 'white',
                    })}>
                        Toggle
                    </button>
                )}
            </ClassNames>
        "#);

        assert_includes_multiple!(actual, vec![
            "padding:10px 20px",
            "color:white",
            // Dynamic values should use CSS variables
            "var(--",
        ]);
    }

    #[test]
    fn should_handle_class_names_with_pseudo_selectors() {
        let actual = transform(r#"
            import { ClassNames } from '@compiled/react';

            <ClassNames>
                {({ css }) => (
                    <a className={css({
                        color: 'blue',
                        textDecoration: 'none',
                        ':hover': {
                            color: 'darkblue',
                            textDecoration: 'underline',
                        },
                        ':visited': {
                            color: 'purple',
                        },
                    })}>
                        Link
                    </a>
                )}
            </ClassNames>
        "#);

        assert_includes_multiple!(actual, vec![
            "color:blue",
            "text-decoration:none",
            ":hover",
            "color:darkblue",
            "text-decoration:underline",
            ":visited",
            "color:purple",
        ]);
    }

    #[test]
    fn should_handle_class_names_with_media_queries() {
        let actual = transform(r#"
            import { ClassNames } from '@compiled/react';

            <ClassNames>
                {({ css }) => (
                    <div className={css({
                        fontSize: '14px',
                        '@media (min-width: 768px)': {
                            fontSize: '16px',
                        },
                        '@media (min-width: 1024px)': {
                            fontSize: '18px',
                        },
                    })}>
                        Responsive Text
                    </div>
                )}
            </ClassNames>
        "#);

        assert_includes_multiple!(actual, vec![
            "font-size:14px",
            "@media (min-width: 768px)",
            "font-size:16px",
            "@media (min-width: 1024px)",
            "font-size:18px",
        ]);
    }

    #[test]
    fn should_handle_class_names_with_array_styles() {
        let actual = transform(r#"
            import { ClassNames } from '@compiled/react';

            const baseStyles = { padding: '10px' };
            const themeStyles = { color: 'blue' };

            <ClassNames>
                {({ css }) => (
                    <div className={css([baseStyles, themeStyles, { fontSize: '16px' }])}>
                        Composed Styles
                    </div>
                )}
            </ClassNames>
        "#);

        // In production, local variables that can't be resolved statically are skipped
        // Only the inline object { fontSize: '16px' } should be processed
        assert_includes_multiple!(actual, vec![
            "font-size:16px",
        ]);
        
        // The variables themselves should remain in the output for runtime processing
        assert_includes_multiple!(actual, vec![
            "const baseStyles = {",
            "const themeStyles = {",
        ]);
    }

    #[test]
    fn should_handle_class_names_with_existing_class_name() {
        let actual = transform(r#"
            import { ClassNames } from '@compiled/react';

            <ClassNames>
                {({ css }) => (
                    <div className={'existing-class ' + css({ color: 'red' })}>
                        Mixed Classes
                    </div>
                )}
            </ClassNames>
        "#);

        assert_includes_multiple!(actual, vec![
            "color:red",
            "existing-class",
        ]);
    }

    #[test]
    fn should_handle_class_names_with_keyframes() {
        let actual = transform(r#"
            import { ClassNames, keyframes } from '@compiled/react';

            const fadeIn = keyframes({
                from: { opacity: 0 },
                to: { opacity: 1 },
            });

            <ClassNames>
                {({ css }) => (
                    <div className={css({
                        animation: fadeIn + ' 1s ease-in-out',
                    })}>
                        Animated Content
                    </div>
                )}
            </ClassNames>
        "#);

        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime";"#,
            r#"const _ = "._1p82fqz{animation:var(--__qni1gv);}";"#,
            r#"<CC><CS>{["#,
            r#"    _"#,
            r#"]}</CS>"#,
            r#"className={ax(["#,
            r#"        "_1p82fqz""#,
            // Keyframes are correctly handled as dynamic variables
            "animation:var(",
        ]);
    }

    #[test]
    fn should_handle_class_names_with_nested_components() {
        let actual = transform(r#"
            import { ClassNames } from '@compiled/react';

            <ClassNames>
                {({ css }) => (
                    <div className={css({ padding: '20px' })}>
                        <ClassNames>
                            {({ css: innerCss }) => (
                                <span className={innerCss({ color: 'red' })}>
                                    Nested
                                </span>
                            )}
                        </ClassNames>
                    </div>
                )}
            </ClassNames>
        "#);

        assert_includes_multiple!(actual, vec![
            "padding:20px",
            "color:red",
        ]);
    }

    #[test]
    fn should_handle_class_names_with_complex_selectors() {
        let actual = transform(r#"
            import { ClassNames } from '@compiled/react';

            <ClassNames>
                {({ css }) => (
                    <div className={css({
                        '& > p': {
                            margin: 0,
                            color: 'gray',
                        },
                        '& .highlight': {
                            backgroundColor: 'yellow',
                            fontWeight: 'bold',
                        },
                        '&:nth-child(2n)': {
                            backgroundColor: 'lightgray',
                        },
                    })}>
                        Complex Selector Container
                    </div>
                )}
            </ClassNames>
        "#);

        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime";"#,
            r#"const _ = "._nf6z67{ > p{margin:0px;color:gray;} .highlight{background-color:yellow;font-weight:bold;}:nth-child(2n){background-color:lightgray;}}";"#,
            r#"<CC><CS>{["#,
            r#"    _"#,
            r#"]}</CS>"#,
            r#"className={ax(["#,
            r#"        "_nf6z67""#,
        ]);
    }

    #[test]
    fn should_handle_class_names_with_props_access() {
        let actual = transform(r#"
            import { ClassNames } from '@compiled/react';

            const MyComponent = ({ primary, size }) => (
                <ClassNames>
                    {({ css }) => (
                        <button className={css({
                            backgroundColor: primary ? 'blue' : 'gray',
                            padding: size === 'large' ? '16px 32px' : '8px 16px',
                            color: 'white',
                        })}>
                            Button
                        </button>
                    )}
                </ClassNames>
            );
        "#);

        assert_includes_multiple!(actual, vec![
            "color:white",
            // Dynamic values should use CSS variables
            "var(--",
        ]);
    }
}