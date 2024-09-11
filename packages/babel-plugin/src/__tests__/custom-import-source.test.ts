import { transform } from '../test-utils';

describe('custom import source', () => {
  it('should pick up atlaskit css without needing to configure', () => {
    const actual = transform(
      `
      import { css } from '@atlaskit/css';

      const styles = css({ color: 'red' });

      <div css={styles} />
    `,
      { filename: './foo/index.js' }
    );

    expect(actual).toInclude('@compiled/react/runtime');
  });

  it('should pick up custom relative import source', () => {
    const actual = transform(
      `
      import { css } from '../bar/stub-api';

      const styles = css({ color: 'red' });

      <div css={styles} />
    `,
      { filename: './foo/index.js', importSources: ['./bar/stub-api'] }
    );

    expect(actual).toInclude('@compiled/react/runtime');
  });

  it('should pick up custom absolute import source', () => {
    const actual = transform(
      `
        import { css } from '/bar/stub-api';

        const styles = css({ color: 'red' });

        <div css={styles} />
      `,
      { filename: './foo/index.js', importSources: ['/bar/stub-api'] }
    );

    expect(actual).toInclude('@compiled/react/runtime');
  });

  it('should pick up custom package import source', () => {
    const actual = transform(
      `
        import { css } from '@af/compiled';

        const styles = css({ color: 'red' });

        <div css={styles} />
      `,
      { filename: './foo/index.js', importSources: ['@af/compiled'] }
    );

    expect(actual).toInclude('@compiled/react/runtime');
  });

  it('should pick up an automatic pragma from a custom package import source', () => {
    const actual = transform(
      `
        /** @jsxImportSource @af/compiled */
        <div css={{ color: 'red' }} />
      `,
      { filename: './foo/index.js', importSources: ['@af/compiled'] }
    );

    expect(actual).toInclude('@compiled/react/runtime');
  });

  it("should handle custom package sources that aren't found", () => {
    expect(() =>
      transform(
        `
        import { css } from '@af/compiled';

        const styles = css({ color: 'red' });

        <div css={styles} />
      `,
        { filename: './foo/index.js', importSources: ['asdasd2323'] }
      )
    ).not.toThrow();
  });

  it('should throw error explaining resolution steps when using custom import source that hasnt been configured', () => {
    expect(() =>
      transform(
        `
        /** @jsxImportSource @compiled/react */
        import { css } from '@private/misconfigured';

        const styles = css({ color: 'red' });

        <div css={styles} />
      `,
        { filename: '/foo/index.js', highlightCode: false }
      )
    ).toThrowErrorMatchingInlineSnapshot(`
      "/foo/index.js: This CallExpression was unable to have its styles extracted — no Compiled APIs were found in scope, if you're using createStrictAPI make sure to configure importSources (5:23).
        3 |         import { css } from '@private/misconfigured';
        4 |
      > 5 |         const styles = css({ color: 'red' });
          |                        ^^^^^^^^^^^^^^^^^^^^^
        6 |
        7 |         <div css={styles} />
        8 |       "
    `);
  });
});
