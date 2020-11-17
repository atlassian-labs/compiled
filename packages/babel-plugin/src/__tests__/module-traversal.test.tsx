import { transformSync } from '@babel/core';
import babelPlugin from '../index';

jest.mock('../utils/cache');

const transform = (code: string) => {
  try {
    return transformSync(code, {
      configFile: false,
      babelrc: false,
      compact: true,
      highlightCode: false,
      filename: process.cwd() + '/packages/babel-plugin/src/__tests__/module-traversal.test.js',
      plugins: [babelPlugin],
    })?.code;
  } catch (e) {
    // remove cwd from error message to it is consistent local and in CI
    e.message = e.message.replace(process.cwd(), '');
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

  it('should replace an identifier referencing a default import specificer string literal', () => {
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

  it('should replace an identifier referencing a default import specificer string literal', () => {
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

  it('should replace an identifier referencing a named import specifier object', () => {
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

  it('should replace an identifier referencing a node modules named import specifier object', () => {
    const result = transform(
      `
      import '@compiled/react';
      import React from 'react';
      import { colors } from 'module-a';

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

  it('should inline css from a object spread referencing a named import object', () => {
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

  it('should inline css from a object with multiple identifiers referenced from a named import', () => {
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
});
