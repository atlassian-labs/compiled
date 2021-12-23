import { transformSync } from '@babel/core';

import babelPlugin from '../index';
import type { PluginOptions } from '../types';

jest.mock('../utils/cache');

const transform = (code: string, opts: PluginOptions = {}) => {
  try {
    return transformSync(code, {
      configFile: false,
      babelrc: false,
      compact: true,
      highlightCode: false,
      filename: process.cwd() + '/packages/babel-plugin/src/__tests__/module-traversal.test.js',
      plugins: [[babelPlugin, opts]],
    })?.code;
  } catch (e: unknown) {
    if (e instanceof Error) {
      // remove cwd from error message to it is consistent local and in CI
      e.message = e.message.replace(process.cwd(), '');
    }
    throw e;
  }
};

describe('module traversal', () => {
  it('should replace an identifier referencing a default import specifier object', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import colors from '../__fixtures__/mixins/objects';

      <div css={{ color: colors.primary }} />
    `
    );

    expect(result).toInclude('{color:blue}');
  });

  it('should replace an identifier referencing a default import specifier string literal', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import color from '../__fixtures__/mixins/simple';

      <div css={{ color }} />
    `
    );

    expect(result).toInclude('{color:red}');
  });

  it('should replace an identifier referencing a default import specifier string literal', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import { primary } from '../__fixtures__/mixins/simple';

      <div css={{ color: primary }} />
    `
    );

    expect(result).toInclude('{color:red}');
  });

  it('should replace an identifier referencing a named import specifier object from a variable declaration export', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import { colors } from '../__fixtures__/mixins/objects';

      <div css={{ color: colors.primary }} />
    `
    );

    expect(result).toInclude('{color:red}');
  });

  it('should replace an identifier referencing a named import specifier object from an export specifier', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import { danger } from '../__fixtures__/mixins/objects';

      <div css={{ color: danger }} />
    `
    );

    expect(result).toInclude('{color:blue}');
  });

  it('should replace an identifier referencing a node modules named import specifier object', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import { colors } from '@compiled-private/module-a';

      <div css={{ color: colors.primary }} />
    `
    );

    expect(result).toInclude('{color:purple}');
  });

  it('should use css from an identifier referencing a named import object', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import { style } from '../__fixtures__/mixins/objects';

      <div css={style} />
    `
    );

    expect(result).toInclude('{font-size:12px}');
  });

  it('should inline css from an object spread referencing a named import object', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import { style } from '../__fixtures__/mixins/objects';

      <div css={{ color: 'blue', ...style }} />
    `
    );

    expect(result).toInclude('{color:blue}');
    expect(result).toInclude('{font-size:12px}');
  });

  it('should inline css from an object with multiple identifiers referenced from a named import', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import { styleInlining } from '../__fixtures__/mixins/objects';

      <div css={styleInlining} />
    `
    );

    expect(result).toInclude('{font-size:14px}');
    expect(result).toInclude('{color:blue}');
    expect(result).toInclude('{background-color:red}');
  });

  it('should inline css from a object with multiple identifiers referenced from a named import', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import { styleInlining } from '../__fixtures__/mixins/objects';

      <div css={{ ...styleInlining }} />
    `
    );

    expect(result).toInclude('{font-size:14px}');
    expect(result).toInclude('{color:blue}');
    expect(result).toInclude('{background-color:red}');
  });

  it('should inline css from a spread referencing an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import { styleModuleInlining } from '../__fixtures__/mixins/objects';

      <div css={{ ...styleModuleInlining }} />
    `
    );

    expect(result).toInclude('{color:pink}');
  });

  it('should inline css from an identifier referencing an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import { styleModuleInlining } from '../__fixtures__/mixins/objects';

      <div css={styleModuleInlining} />
    `
    );

    expect(result).toInclude('{color:pink}');
  });

  it('should inline css from an export rexporting an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/react';
      import { reexport } from '../__fixtures__/mixins/reexport';

      <div css={{ color: reexport }} />
    `
    );

    expect(result).toInclude('{color:purple}');
  });

  it('should inline css from a member expression export rexporting an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/react';
      import { objectReexport } from '../__fixtures__/mixins/reexport';

      <div css={{ color: objectReexport.foo }} />
    `
    );

    expect(result).toInclude('{color:orange}');
  });

  it('should inline css from a member expression that comprises of an import being exposed by a local variable', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import { danger } from '../__fixtures__/mixins/objects';

      const theme = { danger };
      <div css={{ color: theme.danger }} />
    `
    );

    expect(result).toInclude('{color:blue}');
  });

  it('should inline a static string', () => {
    const result = transform(
      `
      import '@compiled/react';
      import { bold } from '../__fixtures__/mixins/strings';

      <div css={bold} />
    `
    );

    expect(result).toInclude('{font-size:12px}');
    expect(result).toInclude('{font-weight:bold}');
  });

  it('should inline a string with module interpolations', () => {
    const result = transform(
      `
      import '@compiled/react';
      import { italics } from '../__fixtures__/mixins/strings';

      <div css={[italics]} />
    `
    );

    expect(result).toInclude('{font-size:16px}');
    expect(result).toInclude('{font-weight:italic}');
  });

  it('should inline a string with import interpolations', () => {
    const result = transform(
      `
      import '@compiled/react';
      import { danger } from '../__fixtures__/mixins/strings';

      <div css={[danger]} />
    `
    );

    expect(result).toInclude('{color:red}');
    expect(result).toInclude('{font-size:10px}');
  });

  it('should inline css from a spread referencing an identifier with an IIFE property from another module', () => {
    const result = transform(
      `
      import '@compiled/react';
      import { fontMixin } from '../__fixtures__/mixins/objects';

      <div css={{ ...fontMixin }} />
    `
    );

    expect(result).toInclude('{font-size:12px}');
  });

  it('should inline css from an array referencing an identifier with an IIFE property from another module', () => {
    const result = transform(
      `
    import '@compiled/react';
    import { fontMixin } from '../__fixtures__/mixins/objects';

    <div css={[fontMixin]} />
  `
    );

    expect(result).toInclude('{font-size:12px}');
  });

  it('should inline css from a function mixin referencing an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/react';
      import { colorMixin } from '../__fixtures__/mixins/objects';

      <div css={{ ':hover': colorMixin() }} />
    `
    );

    expect(result).toInclude(':hover{color:red}');
    expect(result).toInclude(':hover{background-color:pink}');
  });

  it('should inline css for object literal from a directly called & assigned function mixin referencing an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/react';
      import { colorMixin } from '../__fixtures__/mixins/objects';

      const colors = colorMixin();

      <div css={{':hover': { color: colors.color }}} />
    `
    );

    expect(result).toInclude(':hover{color:red}');
  });

  it('should inline css for string literal from a directly called & assigned function mixin referencing an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/react';
      import { colorMixin } from '../__fixtures__/mixins/objects';

      const colors = colorMixin();

      <div css={\`:hover { color: \${colors.color}; }\`} />
    `
    );

    expect(result).toInclude(':hover{color:red}');
  });

  it('should inline css from a directly called function mixin referencing an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/react';
      import { colorMixin } from '../__fixtures__/mixins/objects';

      <div css={{':hover': { color: colorMixin().color }}} />
    `
    );

    expect(result).toInclude(':hover{color:red}');
  });

  it('should inline css from a directly called function mixin referencing an identifier with an IIFE property from another module', () => {
    const result = transform(
      `
      import '@compiled/react';
      import { spacingMixin } from '../__fixtures__/mixins/objects';

      <div css={{':hover': { paddingTop: spacingMixin.padding.top() }}} />
    `
    );

    expect(result).toInclude(':hover{padding-top:10px}');
  });

  it('should inline css when destructuring an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/react';
      import { spacingMixin } from '../__fixtures__/mixins/objects';

      const { padding: { top } } = spacingMixin;

      <div css={{':hover': { paddingTop: top() }}} />
    `
    );

    expect(result).toInclude(':hover{padding-top:10px}');
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

  it('should callback with included filepath using CSS object', () => {
    const result: string[] = [];

    transform(
      `
        import '@compiled/react';
        import { colorMixin2 } from '../__fixtures__/mixins/objects';

        const color = { blue: 'blue' };

        const Component = (props) => {
          return <div css={{ ...colorMixin2(color.blue) }} />
        };
    `,
      { onIncludedFiles: (files) => result.push(...files) }
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toInclude(
      'compiled/packages/babel-plugin/src/__fixtures__/mixins/objects.js'
    );
  });

  it('should callback with included filepath using CSS property', () => {
    const result: string[] = [];

    transform(
      `
        import '@compiled/react';
        import { primary } from '../__fixtures__/mixins/simple';

        const Component = (props) => {
          return <div css={{ color: primary }} />
        };
    `,
      { onIncludedFiles: (files) => result.push(...files) }
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toInclude('compiled/packages/babel-plugin/src/__fixtures__/mixins/simple.js');
  });

  it('should callback with included filepath using CSS template literal', () => {
    const result: string[] = [];

    transform(
      `
        import '@compiled/react';
        import { primary } from '../__fixtures__/mixins/simple';

        const Component = (props) => {
          return <div css={\`color: \${primary}\`} />
        };
    `,
      { onIncludedFiles: (files) => result.push(...files) }
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toInclude('compiled/packages/babel-plugin/src/__fixtures__/mixins/simple.js');
  });

  describe('Namespace imports', () => {
    it('should replace a member expression referencing a default export', () => {
      const result = transform(`
        import '@compiled/react';
        import React from 'react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{ color: objects.default.primary }} />
      `);

      expect(result).toInclude('{color:blue}');
    });

    it('should replace a member expression referencing a default export from within a local variable', () => {
      const result = transform(`
        import '@compiled/react';
        import React from 'react';
        import * as objects from '../__fixtures__/mixins/objects';

        const library = { objects };

        <div css={{ color: library.objects.default.primary }} />
      `);

      expect(result).toInclude('{color:blue}');
    });

    it('should replace a member expression referencing a function export from within a local variable', () => {
      const result = transform(`
        import '@compiled/react';
        import React from 'react';
        import * as objects from '../__fixtures__/mixins/objects';

        const library = { objects };
        const color = { green: 'green' };

        <div css={{ backgroundColor: library.objects.colorMixin2(color.green).backgroundColor }} />
      `);

      expect(result).toInclude('{background-color:green}');
    });

    it('should replace a member expression referencing a named variable export', () => {
      const result = transform(`
        import '@compiled/react';
        import React from 'react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{ color: objects.colors.primary }} />
      `);

      expect(result).toInclude('{color:red}');
    });

    it('should replace a member expression referencing an export specifier', () => {
      const result = transform(`
        import '@compiled/react';
        import React from 'react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{ color: objects.danger }} />
      `);

      expect(result).toInclude('{color:blue}');
    });

    it('should inline css from an object spread', () => {
      const result = transform(`
        import '@compiled/react';
        import React from 'react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{ ...objects.style }} />
      `);

      expect(result).toInclude('{font-size:12px}');
    });

    it('should inline css from an call expression', () => {
      const result = transform(`
        import '@compiled/react';
        import React from 'react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{ ...objects.colorMixin() }} />
      `);

      expect(result).toIncludeMultiple(['{color:red}', '{background-color:pink}']);
    });

    it('should inline css from an identifier with an IIFE property', () => {
      const result = transform(`
        import '@compiled/react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{ ...objects.fontMixin }} />
      `);

      expect(result).toInclude('{font-size:12px}');
    });

    it('should inline css from a function mixin with parameters', () => {
      const result = transform(`
        import '@compiled/react';
        import * as objects from '../__fixtures__/mixins/objects';

        const color = { blue: 'blue' };

        <div css={{ ...objects.colorMixin2(color.blue) }} />
      `);

      expect(result).toIncludeMultiple(['{color:red}', '{background-color:blue}']);
    });

    it('should inline css from a directly called function mixin', () => {
      const result = transform(`
        import '@compiled/react';
        import * as objects from '../__fixtures__/mixins/objects';

        <div css={{':hover': { paddingTop: objects.spacingMixin.padding.top() }}} />
      `);

      expect(result).toInclude(':hover{padding-top:10px}');
    });
  });
});
