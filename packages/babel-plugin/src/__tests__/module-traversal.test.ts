import { join } from 'path';

import type { TransformOptions } from '../test-utils';
import { transform as transformCode } from '../test-utils';

import Mock = jest.Mock;

jest.mock('../utils/cache');

describe('module traversal', () => {
  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { filename: join(__dirname, 'module-traversal.js'), ...opts });

  it('should replace an identifier referencing a default import specifier object', () => {
    const actual = transform(`
      import '@compiled/react';
      import colors from '../__fixtures__/mixins/objects';

      <div css={{ color: colors.primary }} />
    `);

    expect(actual).toInclude('{color:blue}');
  });

  it('should replace an identifier referencing a default import specifier string literal', () => {
    const actual = transform(`
      import '@compiled/react';
      import color from '../__fixtures__/mixins/simple';

      <div css={{ color }} />
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should replace an identifier referencing a default import specifier string literal', () => {
    const actual = transform(`
      import '@compiled/react';
      import { primary } from '../__fixtures__/mixins/simple';

      <div css={{ color: primary }} />
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should replace an identifier referencing a named import specifier object from a variable declaration export', () => {
    const actual = transform(`
      import '@compiled/react';
      import { colors } from '../__fixtures__/mixins/objects';

      <div css={{ color: colors.primary }} />
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should replace an identifier referencing a named import specifier object from an export specifier', () => {
    const actual = transform(`
      import '@compiled/react';
      import { danger } from '../__fixtures__/mixins/objects';

      <div css={{ color: danger }} />
    `);

    expect(actual).toInclude('{color:blue}');
  });

  it('should replace an identifier referencing a node modules named import specifier object', () => {
    const actual = transform(`
      import '@compiled/react';
      import { colors } from '@compiled-private/module-a';

      <div css={{ color: colors.primary }} />
    `);

    expect(actual).toInclude('{color:purple}');
  });

  it('should use css from an identifier referencing a named import object', () => {
    const actual = transform(`
      import '@compiled/react';
      import { style } from '../__fixtures__/mixins/objects';

      <div css={style} />
    `);

    expect(actual).toInclude('{font-size:12px}');
  });

  it('should inline css from an object spread referencing a named import object', () => {
    const actual = transform(`
      import '@compiled/react';
      import { style } from '../__fixtures__/mixins/objects';

      <div css={{ color: 'blue', ...style }} />
    `);

    expect(actual).toInclude('{color:blue}');
    expect(actual).toInclude('{font-size:12px}');
  });

  it('should inline css from an object with multiple identifiers referenced from a named import', () => {
    const actual = transform(`
      import '@compiled/react';
      import { styleInlining } from '../__fixtures__/mixins/objects';

      <div css={styleInlining} />
    `);

    expect(actual).toInclude('{font-size:14px}');
    expect(actual).toInclude('{color:blue}');
    expect(actual).toInclude('{background-color:red}');
  });

  it('should inline css from a object with multiple identifiers referenced from a named import', () => {
    const actual = transform(`
      import '@compiled/react';
      import { styleInlining } from '../__fixtures__/mixins/objects';

      <div css={{ ...styleInlining }} />
    `);

    expect(actual).toInclude('{font-size:14px}');
    expect(actual).toInclude('{color:blue}');
    expect(actual).toInclude('{background-color:red}');
  });

  it('should inline css from a spread referencing an identifier from another module', () => {
    const actual = transform(`
      import '@compiled/react';
      import { styleModuleInlining } from '../__fixtures__/mixins/objects';

      <div css={{ ...styleModuleInlining }} />
    `);

    expect(actual).toInclude('{color:pink}');
  });

  it('should inline css from an identifier referencing an identifier from another module', () => {
    const actual = transform(`
      import '@compiled/react';
      import { styleModuleInlining } from '../__fixtures__/mixins/objects';

      <div css={styleModuleInlining} />
    `);

    expect(actual).toInclude('{color:pink}');
  });

  it('should inline css from an export rexporting an identifier from another module', () => {
    const actual = transform(`
      import '@compiled/react';
      import { reexport } from '../__fixtures__/mixins/reexport';

      <div css={{ color: reexport }} />
    `);

    expect(actual).toInclude('{color:purple}');
  });

  it('should inline css from a member expression export rexporting an identifier from another module', () => {
    const actual = transform(`
      import '@compiled/react';
      import { objectReexport } from '../__fixtures__/mixins/reexport';

      <div css={{ color: objectReexport.foo }} />
    `);

    expect(actual).toInclude('{color:orange}');
  });

  it('should inline css from a member expression that comprises of an import being exposed by a local variable', () => {
    const actual = transform(`
      import '@compiled/react';
      import { danger } from '../__fixtures__/mixins/objects';

      const theme = { danger };
      <div css={{ color: theme.danger }} />
    `);

    expect(actual).toInclude('{color:blue}');
  });

  it('should inline a static string', () => {
    const actual = transform(`
      import '@compiled/react';
      import { bold } from '../__fixtures__/mixins/strings';

      <div css={bold} />
    `);

    expect(actual).toInclude('{font-size:12px}');
    expect(actual).toInclude('{font-weight:bold}');
  });

  it('should inline a string with module interpolations', () => {
    const actual = transform(`
      import '@compiled/react';
      import { italics } from '../__fixtures__/mixins/strings';

      <div css={[italics]} />
    `);

    expect(actual).toInclude('{font-size:16px}');
    expect(actual).toInclude('{font-weight:italic}');
  });

  it('should inline a string with import interpolations', () => {
    const actual = transform(`
      import '@compiled/react';
      import { danger } from '../__fixtures__/mixins/strings';

      <div css={[danger]} />
    `);

    expect(actual).toInclude('{color:red}');
    expect(actual).toInclude('{font-size:10px}');
  });

  it('should inline css from a spread referencing an identifier with an IIFE property from another module', () => {
    const actual = transform(`
      import '@compiled/react';
      import { fontMixin } from '../__fixtures__/mixins/objects';

      <div css={{ ...fontMixin }} />
    `);

    expect(actual).toInclude('{font-size:12px}');
  });

  it('should inline css from an array referencing an identifier with an IIFE property from another module', () => {
    const actual = transform(`
      import '@compiled/react';
      import { fontMixin } from '../__fixtures__/mixins/objects';

      <div css={[fontMixin]} />
    `);

    expect(actual).toInclude('{font-size:12px}');
  });

  it('should inline css from a function mixin referencing an identifier from another module', () => {
    const actual = transform(`
      import '@compiled/react';
      import { colorMixin } from '../__fixtures__/mixins/objects';

      <div css={{ ':hover': colorMixin() }} />
    `);

    expect(actual).toInclude(':hover{color:red}');
    expect(actual).toInclude(':hover{background-color:pink}');
  });

  it('should inline css for object literal from a directly called & assigned function mixin referencing an identifier from another module', () => {
    const actual = transform(`
      import '@compiled/react';
      import { colorMixin } from '../__fixtures__/mixins/objects';

      const colors = colorMixin();

      <div css={{':hover': { color: colors.color }}} />
    `);

    expect(actual).toInclude(':hover{color:red}');
  });

  it('should inline css for string literal from a directly called & assigned function mixin referencing an identifier from another module', () => {
    const actual = transform(`
      import '@compiled/react';
      import { colorMixin } from '../__fixtures__/mixins/objects';

      const colors = colorMixin();

      <div css={\`:hover { color: \${colors.color}; }\`} />
    `);

    expect(actual).toInclude(':hover{color:red}');
  });

  it('should inline css from a directly called function mixin referencing an identifier from another module', () => {
    const actual = transform(`
      import '@compiled/react';
      import { colorMixin } from '../__fixtures__/mixins/objects';

      <div css={{':hover': { color: colorMixin().color }}} />
    `);

    expect(actual).toInclude(':hover{color:red}');
  });

  it('should inline css from a directly called function mixin referencing an identifier with an IIFE property from another module', () => {
    const actual = transform(`
      import '@compiled/react';
      import { spacingMixin } from '../__fixtures__/mixins/objects';

      <div css={{':hover': { paddingTop: spacingMixin.padding.top() }}} />
    `);

    expect(actual).toInclude(':hover{padding-top:10px}');
  });

  it('should inline css when destructuring an identifier from another module', () => {
    const actual = transform(`
      import '@compiled/react';
      import { spacingMixin } from '../__fixtures__/mixins/objects';

      const { padding: { top } } = spacingMixin;

      <div css={{':hover': { paddingTop: top() }}} />
    `);

    expect(actual).toInclude(':hover{padding-top:10px}');
  });

  it('should inline css from a function mixin with parameters referencing an identifier from another module', () => {
    const actual = transform(`
      import '@compiled/react';
      import { colorMixin2 } from '../__fixtures__/mixins/objects';

      const color = { blue: 'blue' };

      const Component = (props) => {
        return <div css={{ ...colorMixin2(color.blue) }} />
      };
    `);

    expect(actual).toIncludeMultiple(['{color:red}', '{background-color:blue}']);
  });

  it('handles template literal with imported selectors from external modules', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      import { ID_SELECTOR } from '../__fixtures__/mixins/strings';

      const BackgroundWithSelector = styled.div({
        [\`\${ID_SELECTOR}\`]: {
          backgroundColor: 'green',
        },
      });

      <BackgroundWithSelector>
        <div id="id-selector">Green box in selector div</div>
      </BackgroundWithSelector>;
    `);

    expect(actual).toInclude('._tcqlbf54 #id-selector{background-color:green}');
  });

  it('handles template literal with imported selectors from external modules with substitution', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      import { JOINED_SELECTOR } from '../__fixtures__/mixins/strings';
      import { primary } from '../__fixtures__/mixins/simple';

      const BackgroundWithSelector = styled.div({
        [\`\${JOINED_SELECTOR}, .\${primary}\`]: {
          backgroundColor: 'green',
        },
      });

      <BackgroundWithSelector>
        <div id="id-selector">Green box in selector div</div>
      </BackgroundWithSelector>;
    `);

    // This gets split into two rules due to flattenMultipleSelectors
    expect(actual).toIncludeMultiple([
      '._15rzbf54 #joined-selector{background-color:green}',
      '._1khrbf54 .red{background-color:green}',
    ]);
  });

  describe('should call onIncludedFiles with the filepath', () => {
    let onIncludedFiles: Mock;

    beforeEach(() => {
      onIncludedFiles = jest.fn();
    });

    it('when using a CSS object', () => {
      const code = `
        import '@compiled/react';
        import { colorMixin2 } from '../__fixtures__/mixins/objects';

        const color = { blue: 'blue' };

        const Component = (props) => {
          return <div css={{ ...colorMixin2(color.blue) }} />
        };
      `;

      transform(code, { onIncludedFiles });

      expect(onIncludedFiles).toHaveBeenCalledTimes(1);
      expect(onIncludedFiles).toHaveBeenCalledWith([
        expect.stringContaining(
          'compiled/packages/babel-plugin/src/__fixtures__/mixins/objects.js'
        ),
      ]);
    });

    it('when using a CSS property', () => {
      const code = `
        import '@compiled/react';
        import { primary } from '../__fixtures__/mixins/simple';

        const Component = (props) => {
          return <div css={{ color: primary }} />
        };
      `;

      transform(code, { onIncludedFiles });

      expect(onIncludedFiles).toHaveBeenCalledTimes(1);
      expect(onIncludedFiles).toHaveBeenCalledWith([
        expect.stringContaining('compiled/packages/babel-plugin/src/__fixtures__/mixins/simple.js'),
      ]);
    });

    it('when using CSS template literal', () => {
      const code = `
        import '@compiled/react';
        import { primary } from '../__fixtures__/mixins/simple';

        const Component = (props) => {
          return <div css={\`color: \${primary}\`} />
        };
      `;

      transform(code, { onIncludedFiles });

      expect(onIncludedFiles).toHaveBeenCalledTimes(1);
      expect(onIncludedFiles).toHaveBeenCalledWith([
        expect.stringContaining('compiled/packages/babel-plugin/src/__fixtures__/mixins/simple.js'),
      ]);
    });
  });

  describe('namespace imports', () => {
    it('should replace a member expression referencing a default export', () => {
      const actual = transform(`
        import '@compiled/react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{ color: objects.default.primary }} />
      `);

      expect(actual).toInclude('{color:blue}');
    });

    it('should replace a member expression referencing a default export from within a local variable', () => {
      const actual = transform(`
        import '@compiled/react';
        import * as objects from '../__fixtures__/mixins/objects';

        const library = { objects };

        <div css={{ color: library.objects.default.primary }} />
      `);

      expect(actual).toInclude('{color:blue}');
    });

    it('should replace a member expression referencing a function export from within a local variable', () => {
      const actual = transform(`
        import '@compiled/react';
        import * as objects from '../__fixtures__/mixins/objects';

        const library = { objects };
        const color = { green: 'green' };

        <div css={{ backgroundColor: library.objects.colorMixin2(color.green).backgroundColor }} />
      `);

      expect(actual).toInclude('{background-color:green}');
    });

    it('should replace a member expression referencing a named variable export', () => {
      const actual = transform(`
        import '@compiled/react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{ color: objects.colors.primary }} />
      `);

      expect(actual).toInclude('{color:red}');
    });

    it('should replace a member expression referencing an export specifier', () => {
      const actual = transform(`
        import '@compiled/react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{ color: objects.danger }} />
      `);

      expect(actual).toInclude('{color:blue}');
    });

    it('should inline css from an object spread', () => {
      const actual = transform(`
        import '@compiled/react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{ ...objects.style }} />
      `);

      expect(actual).toInclude('{font-size:12px}');
    });

    it('should inline css from an call expression', () => {
      const actual = transform(`
        import '@compiled/react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{ ...objects.colorMixin() }} />
      `);

      expect(actual).toIncludeMultiple(['{color:red}', '{background-color:pink}']);
    });

    it('should inline css from an identifier with an IIFE property', () => {
      const actual = transform(`
        import '@compiled/react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{ ...objects.fontMixin }} />
      `);

      expect(actual).toInclude('{font-size:12px}');
    });

    it('should inline css from a function mixin with parameters', () => {
      const actual = transform(`
        import '@compiled/react';
        import * as objects from '../__fixtures__/mixins/objects';

        const color = { blue: 'blue' };

        <div css={{ ...objects.colorMixin2(color.blue) }} />
      `);

      expect(actual).toIncludeMultiple(['{color:red}', '{background-color:blue}']);
    });

    it('should inline css from a directly called function mixin', () => {
      const actual = transform(`
        import '@compiled/react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{ ':hover': { paddingTop: objects.spacingMixin.padding.top() }}} />
      `);

      expect(actual).toInclude(':hover{padding-top:10px}');
    });
  });

  describe('direct re-exports', () => {
    it('should resolve identifier when re-exported as a named export', () => {
      const actual = transform(`
        import '@compiled/react';
        import { secondary } from '../__fixtures__/mixins/reexport';

        <div css={{ color: secondary }} />
      `);

      expect(actual).toInclude('{color:pink}');
    });

    it('should resolve identifier when re-exported as default export', () => {
      const actual = transform(`
        import '@compiled/react';
        import defaultColor from '../__fixtures__/mixins/reexport';

        <div css={{ color: defaultColor }} />
      `);

      expect(actual).toInclude('{color:red}');
    });

    it('should resolve identifier when re-exported default has an alias', () => {
      const actual = transform(`
        import '@compiled/react';
        import { reexportedDefault } from '../__fixtures__/mixins/reexport';

        <div css={{ color: reexportedDefault }} />
      `);

      expect(actual).toInclude('{color:red}');
    });

    it('should resolve member expression in CSS prop', () => {
      const actual = transform(`
        import '@compiled/react';
        import { plainObjectMixin as styles } from '../__fixtures__/mixins/objects';

        <div css={styles.fail}>hello world</div>
      `);

      expect(actual).toInclude(`{color:red}`);
    });

    it('should resolve member expression when mixin has CSS call expression ', () => {
      const actual = transform(`
        import '@compiled/react';
        import { cssCallExpressionMixin as styles } from '../__fixtures__/mixins/objects';

        <div css={styles.fail}>hello world</div>
      `);

      expect(actual).toInclude(`{color:red}`);
    });

    it('should resolve member expression when mixin has aliased CSS call expression ', () => {
      const actual = transform(`
        import { css } from '@compiled/react';
        import { stylesWithAlias } from '../__fixtures__/mixins/alias';

        const styles = {
          layout: css({
            display: 'flex'
          }),
          item: css({
            flexDirection: 'row'
          })
        };

        <div css={styles.layout}>
          <div css={stylesWithAlias.fail}>hello world</div>
          <div css={styles.item}> This is a row </div>
        </div>
      `);

      expect(actual).toIncludeMultiple(['{color:red}', '{display:flex}', '{flex-direction:row}']);
    });

    it('should resolve member expression if used as CSS property', () => {
      const actual = transform(`
        import '@compiled/react';
        import { cssPropertyNames } from '../__fixtures__/mixins/objects';

        <div css={{ [cssPropertyNames.level1.level2]: 'blue' }} />
      `);

      expect(actual).toInclude('{color:blue}');
    });
  });
});
