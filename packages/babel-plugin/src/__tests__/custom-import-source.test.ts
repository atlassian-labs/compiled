import { transform } from '../test-utils';

describe('custom import source', () => {
  it('should pick up custom relative import source', () => {
    const actual = transform(
      `
      import { css } from '../bar/stub-api';

      const styles = css({ color: 'red' });

      <div css={styles} />
    `,
      { filename: './foo/index.js', customModuleOrigins: ['./bar/stub-api'] }
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
      { filename: './foo/index.js', customModuleOrigins: ['/bar/stub-api'] }
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
      { filename: './foo/index.js', customModuleOrigins: ['@af/compiled'] }
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
        { filename: './foo/index.js', customModuleOrigins: ['asdasd2323'] }
      )
    ).not.toThrow();
  });
});
