use compiled_swc::{test_utils::{transform_with_compiled, TestTransformOptions, TestAssertions}, assert_includes, assert_includes_multiple};

#[cfg(test)]
mod jsx_automatic_tests {
    use super::*;

    fn transform(code: &str) -> String {
        transform_with_compiled(code, TestTransformOptions {
            import_react: false, // JSX automatic doesn't import React
            pretty: true,
            ..Default::default()
        })
    }

    fn transform_with_import_sources(code: &str, import_sources: Vec<String>) -> String {
        transform_with_compiled(code, TestTransformOptions {
            import_react: false,
            import_sources,
            pretty: true,
            ..Default::default()
        })
    }

    #[test]
    fn should_work_with_css_prop_and_a_custom_import_source() {
        let actual = transform_with_import_sources(r#"
            import { cssMap } from '@af/compiled';
            const styles = cssMap({ root: { color: 'blue' } });

            <div css={styles.root} />
        "#, vec!["@af/compiled".to_string()]);

        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime""#,
            r#"const _cssMap_root_0 = "._em0xwr{color:blue;}""#,
            r#"root: "_em0xwr""#,
            "className={ax([",
            "styles.root",
        ]);
    }

    #[test]
    fn should_work_with_css_prop() {
        let actual = transform(r#"
            import '@compiled/react';

            <div css={{ color: 'blue' }} />
        "#);

        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime""#,
            r#"color:blue"#,
            "className={ax([",
            r#""_em0xwr""#,
        ]);
    }

    #[test]
    fn should_work_with_class_names() {
        let actual = transform(r#"
            import { ClassNames } from '@compiled/react';

            <ClassNames>
                {props => <div className={props.css({ color: 'blue' })} />}
            </ClassNames>
        "#);

        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime""#,
            "<CC><CS>{[]}</CS>",
            "props.css({",
            "color: 'blue'",
        ]);
    }

    #[test]
    fn should_work_with_styled_components() {
        let actual = transform(r#"
            import { styled } from '@compiled/react';

            const StyledDiv = styled.div({
                color: 'red',
            });

            <StyledDiv />
        "#);

        assert_includes_multiple!(actual, vec![
            r#"import { forwardRef } from "react""#,
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime""#,
            r#"color:red"#,
            "const StyledDiv = forwardRef",
            "className={ax([",
        ]);
    }

    #[test]


    fn should_work_with_keyframes() {
        let actual = transform(r#"
            import { keyframes } from '@compiled/react';

            const fadeIn = keyframes({
                from: { opacity: 0 },
                to: { opacity: 1 },
            });

            <div css={{ animation: `${fadeIn} 1s ease-in-out` }} />
        "#);

        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime""#,
            "opacity:0",
            "opacity:1",
            "const fadeIn =",
            "className={ax([",
        ]);
    }

    #[test]


    fn should_not_import_react_when_jsx_automatic_is_enabled() {
        let actual = transform(r#"
            import '@compiled/react';

            <div css={{ color: 'blue' }} />
        "#);

        // Should not include React import
        assert!(!actual.contains("import React"));
        assert!(!actual.contains("import * as React"));
        
        // Should include runtime imports and CSS generation
        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime""#,
            r#"color:blue"#,
            "className={ax([",
        ]);
    }

    #[test]


    fn should_handle_fragments_with_jsx_automatic() {
        let actual = transform(r#"
            import '@compiled/react';

            <>
                <div css={{ color: 'red' }}>First</div>
                <div css={{ color: 'blue' }}>Second</div>
            </>
        "#);

        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime""#,
            "<>",
            "color:red",
            "color:blue",
            "className={ax([",
        ]);
    }

    #[test]


    fn should_handle_nested_components_with_jsx_automatic() {
        let actual = transform(r#"
            import '@compiled/react';

            const App = () => (
                <div css={{ padding: '20px' }}>
                    <h1 css={{ color: 'red' }}>Title</h1>
                    <p css={{ color: 'blue' }}>Content</p>
                </div>
            );
        "#);

        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime""#,
            "padding:20px",
            "color:red",
            "color:blue",
            "className={ax([",
            "const App = ",
        ]);
    }

    #[test]


    fn should_handle_custom_components_with_jsx_automatic() {
        let actual = transform(r#"
            import '@compiled/react';

            const CustomComponent = ({ children }) => children;

            <CustomComponent>
                <div css={{ color: 'green' }}>Hello</div>
            </CustomComponent>
        "#);

        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime""#,
            "color:green",
            "const CustomComponent =",
            "className={ax([",
        ]);
    }

    #[test]


    fn should_handle_props_spreading_with_jsx_automatic() {
        let actual = transform(r#"
            import '@compiled/react';

            const props = { id: 'test', className: 'existing' };

            <div {...props} css={{ color: 'purple' }}>Content</div>
        "#);

        assert_includes_multiple!(actual, vec![
            r#"import { ax, ix, CC, CS } from "@compiled/react/runtime""#,
            "color:purple",
            "className={ax([",
            "...props",
        ]);
    }
}