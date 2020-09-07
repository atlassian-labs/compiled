import { transformSync } from '@babel/core';
import babelPlugin from '../index';

jest.mock('@compiled/utils', () => {
  return { ...jest.requireActual('@compiled/utils'), hash: () => 'hash-test' };
});

const transform = (code: string) => {
  return transformSync(code, {
    configFile: false,
    babelrc: false,
    compact: true,
    cwd: process.cwd(),
    filename: '/packages/babel-plugin/src/__tests__/module-traversal.test.js',
    plugins: [babelPlugin],
  })?.code;
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

    expect(result).toInclude('.cc-hash-test{color:purple}');
  });
});
