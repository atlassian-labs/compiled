import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';

// Add an example element so we can check the raw CSS styles
const EXAMPLE_USAGE = 'const Element = (variant) => <div css={styles[variant]} />;';

describe('css map values', () => {
  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, ...opts });

  it('should not change cssMap value output when using satisfies expressions', () => {
    const cssMapCode = (height: string) => `
      import { cssMap } from '@compiled/react';

      const bannerMountedVar = '--n_bnrM';
      const styles = cssMap({
        root: {
          height: ${height},
        },
      });

      ${EXAMPLE_USAGE}
    `;

    const actual = transform(
      cssMapCode('`var(--n_bnrM)` satisfies `var(${typeof bannerMountedVar})`')
    );
    const expected = transform(cssMapCode('`var(${bannerMountedVar})`'));

    expect(actual).toInclude('height:var(--n_bnrM)');
    expect(actual).toBe(expected);
  });

  it('should support satisfies expressions in nested cssMap values', () => {
    const cssMapCode = (height: string) => `
      import { cssMap } from '@compiled/react';

      const navigationMountedVar = '--n_tNvM';
      const styles = cssMap({
        root: {
          '&:hover': {
            height: ${height},
          },
        },
      });

      ${EXAMPLE_USAGE}
    `;

    const actual = transform(
      cssMapCode('`var(--n_tNvM)` satisfies `var(${typeof navigationMountedVar})`')
    );
    const expected = transform(cssMapCode('`var(${navigationMountedVar})`'));

    expect(actual).toInclude(':hover{height:var(--n_tNvM)}');
    expect(actual).toBe(expected);
  });
});
