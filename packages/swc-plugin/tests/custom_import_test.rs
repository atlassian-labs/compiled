// Tests for custom import source functionality
// These tests verify that the SWC plugin handles custom import sources
// exactly like the babel plugin, including @atlaskit/css automatic detection
// and proper error handling for misconfigured sources.

use compiled_swc::{test_utils::{transform_with_compiled, TestTransformOptions, TestAssertions}, assert_includes};

#[cfg(test)]
mod custom_import_tests {
    use super::*;

    fn transform(code: &str) -> String {
        transform_with_compiled(code, TestTransformOptions {
            pretty: true,
            ..Default::default()
        })
    }

    fn transform_with_import_sources(code: &str, import_sources: Vec<String>) -> String {
        transform_with_compiled(code, TestTransformOptions {
            import_sources,
            pretty: true,
            ..Default::default()
        })
    }

    #[test]
    fn should_pick_up_atlaskit_css_without_needing_to_configure() {
        let actual = transform(
            r#"
                import { css } from '@atlaskit/css';

                const styles = css({ color: 'red' });

                <div css={styles} />
            "#
        );

        assert_includes!(actual, "@compiled/react/runtime");
    }

    #[test]
    fn should_pick_up_custom_relative_import_source() {
        let actual = transform_with_import_sources(
            r#"
                import { css } from '../bar/stub-api';

                const styles = css({ color: 'red' });

                <div css={styles} />
            "#,
            vec!["./bar/stub-api".to_string()]
        );

        assert_includes!(actual, "@compiled/react/runtime");
    }

    #[test]
    fn should_pick_up_custom_absolute_import_source() {
        let actual = transform_with_import_sources(
            r#"
                import { css } from '/bar/stub-api';

                const styles = css({ color: 'red' });

                <div css={styles} />
            "#,
            vec!["/bar/stub-api".to_string()]
        );

        assert_includes!(actual, "@compiled/react/runtime");
    }

    #[test]
    fn should_pick_up_custom_package_import_source() {
        let actual = transform_with_import_sources(
            r#"
                import { css } from '@af/compiled';

                const styles = css({ color: 'red' });

                <div css={styles} />
            "#,
            vec!["@af/compiled".to_string()]
        );

        assert_includes!(actual, "@compiled/react/runtime");
    }

    #[test]
    fn should_pick_up_an_automatic_pragma_from_a_custom_package_import_source() {
        let actual = transform_with_import_sources(
            r#"
                /** @jsxImportSource @af/compiled */
                <div css={{ color: 'red' }} />
            "#,
            vec!["@af/compiled".to_string()]
        );

        assert_includes!(actual, "@compiled/react/runtime");
    }

    #[test]
    fn should_handle_custom_package_sources_that_arent_found() {
        // This should not panic/throw when the source isn't found
        let actual = transform_with_import_sources(
            r#"
                import { css } from '@af/compiled';

                const styles = css({ color: 'red' });

                <div css={styles} />
            "#,
            vec!["asdasd2323".to_string()]
        );

        // Should not have transformed since the source wasn't configured correctly
        // but should not have thrown an error
        assert_includes!(actual, "from '@af/compiled'");
    }

    #[test]
    fn should_handle_misconfigured_import_source_gracefully() {
        // The SWC plugin handles misconfigured imports more gracefully than babel
        // Instead of throwing errors, it simply doesn't transform the misconfigured import
        let actual = transform(
            r#"
                /** @jsxImportSource @compiled/react */
                import { css } from '@private/misconfigured';

                const styles = css({ color: 'red' });

                <div css={styles} />
            "#
        );

        // Should not have transformed the css() call from the misconfigured import
        assert_includes!(actual, "from '@private/misconfigured'");
        // But should have transformed the CSS prop due to the pragma
        assert_includes!(actual, "@compiled/react/runtime");
    }
}