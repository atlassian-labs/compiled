import { transformSync } from '@babel/core';
import babelPlugin from '../index';

jest.mock('@compiled/utils', () => {
  return { ...jest.requireActual('@compiled/utils'), hash: () => 'hash-test' };
});

jest.mock('../utils/Cache', () => {
  const { Cache } = jest.requireActual('../utils/Cache');

  Cache.getUniqueKey = (key: string, namespace?: string) =>
    namespace ? `${namespace}----${key}` : namespace;

  return { Cache };
});

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
      import '@compiled/core';
      import React from 'react';
      import colors from './stubs/objects';

      <div css={{ color: colors.primary }} />
    `
    );

    expect(result).toInclude('.cc-hash-test{color:blue}');
  });

  it('should replace an identifier referencing a default import specificer string literal', () => {
    const result = transform(
      `
      import '@compiled/core';
      import React from 'react';
      import color from './stubs/simple';

      <div css={{ color }} />
    `
    );

    expect(result).toInclude('.cc-hash-test{color:red}');
  });

  it('should replace an identifier referencing a default import specificer string literal', () => {
    const result = transform(
      `
      import '@compiled/core';
      import React from 'react';
      import { primary } from './stubs/simple';

      <div css={{ color: primary }} />
    `
    );

    expect(result).toInclude('.cc-hash-test{color:red}');
  });

  it('should replace an identifier referencing a named import specifier object', () => {
    const result = transform(
      `
      import '@compiled/core';
      import React from 'react';
      import { colors } from './stubs/objects';

      <div css={{ color: colors.primary }} />
    `
    );

    expect(result).toInclude('.cc-hash-test{color:red}');
  });

  it('should replace an identifier referencing a node modules named import specifier object', () => {
    const result = transform(
      `
      import '@compiled/core';
      import React from 'react';
      import { colors } from 'module-a';

      <div css={{ color: colors.primary }} />
    `
    );

    expect(result).toInclude('.cc-hash-test{color:purple}');
  });

  it('should use css from an identifier referencing a named import object', () => {
    const result = transform(
      `
      import '@compiled/core';
      import React from 'react';
      import { style } from './stubs/objects';

      <div css={style} />
    `
    );

    expect(result).toInclude('.cc-hash-test{font-size:12px}');
  });

  it('should inline css from a object spread referencing a named import object', () => {
    const result = transform(
      `
      import '@compiled/core';
      import React from 'react';
      import { style } from './stubs/objects';

      <div css={{ color: 'blue', ...style }} />
    `
    );

    expect(result).toInclude('.cc-hash-test{color:blue;font-size:12px}');
  });

  it('should inline css from a object with multiple identifiers referenced from a named import', () => {
    const result = transform(
      `
      import '@compiled/core';
      import React from 'react';
      import { styleInlining } from './stubs/objects';

      <div css={styleInlining} />
    `
    );

    expect(result).toInclude('.cc-hash-test{font-size:14px;color:blue;background:red}');
  });

  it('should inline css from a object with multiple identifiers referenced from a named import', () => {
    const result = transform(
      `
      import '@compiled/core';
      import React from 'react';
      import { styleInlining } from './stubs/objects';

      <div css={{ ...styleInlining }} />
    `
    );

    expect(result).toInclude('.cc-hash-test{font-size:14px;color:blue;background:red}');
  });

  it('should inline css from a spread referencing an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/core';
      import React from 'react';
      import { styleModuleInlining } from './stubs/objects';

      <div css={{ ...styleModuleInlining }} />
    `
    );

    expect(result).toInclude('.cc-hash-test{color:pink}');
  });

  it('should inline css from an identifier referencing an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/core';
      import React from 'react';
      import { styleModuleInlining } from './stubs/objects';

      <div css={styleModuleInlining} />
    `
    );

    expect(result).toInclude('.cc-hash-test{color:pink}');
  });

  it('should inline css from an export rexporting an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/core';
      import { reexport } from './stubs/reexport';

      <div css={{ color: reexport }} />
    `
    );

    expect(result).toInclude('.cc-hash-test{color:purple}');
  });

  it('should inline css from a member expression export rexporting an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/core';
      import { objectReexport } from './stubs/reexport';

      <div css={{ color: objectReexport.foo }} />
    `
    );

    expect(result).toInclude('.cc-hash-test{color:orange}');
  });

  it('should inline a static string', () => {
    const result = transform(
      `
      import '@compiled/core';
      import { bold } from './stubs/strings';

      <div css={bold} />
    `
    );

    expect(result).toInclude('.cc-hash-test{font-size:12px;font-weight:bold}');
  });

  it('should inline a string with module interpolations', () => {
    const result = transform(
      `
      import '@compiled/core';
      import { italics } from './stubs/strings';

      <div css={[italics]} />
    `
    );

    expect(result).toInclude('.cc-hash-test{font-size:16px;font-weight:italic}');
  });

  it('should inline a string with import interpolations', () => {
    const result = transform(
      `
      import '@compiled/core';
      import { danger } from './stubs/strings';

      <div css={[danger]} />
    `
    );

    expect(result).toInclude('.cc-hash-test{color:red;font-size:10px}');
  });

  it('should throw when pulling in a CSS like object that could not be statically evaluated', () => {
    expect(() => {
      transform(
        `
        import '@compiled/core';
        import { cantStaticallyEvaluate } from './stubs/objects';

        <div css={[cantStaticallyEvaluate]} />
      `
      );
    }).toThrowErrorMatchingSnapshot();
  });

  it('should throw when spreading a CSS like object that could not be statically evaluated', () => {
    expect(() => {
      transform(
        `
      import '@compiled/core';
      import { cantStaticallyEvaluate } from './stubs/objects';

      <div css={{ ...cantStaticallyEvaluate }} />
    `
      );
    }).toThrowErrorMatchingSnapshot();
  });

  it('should inline css from a function mixin referencing an identifier from another module', () => {
    const result = transform(
      `
      import '@compiled/core';
      import { colorMixin } from './stubs/objects';

      <div css={{ ':hover': colorMixin() }} />
    `
    );

    expect(result).toInclude('.cc-hash-test:hover{color:red;background-color:pink}');
  });

  it('should reference property access expression from another module', () => {
    const result = transform(
      `
      import '@compiled/core';
      import { colorMixin } from './stubs/objects';

      const colors = colorMixin();

      <div css={\`:hover { color: \${colors.color}; }\`} />
    `
    );

    expect(result).toInclude('.cc-hash-test:hover{color:var(--var-hash-test)}');
    expect(result).toInclude('style={{"--var-hash-test":colors.color}}');
  });
});
