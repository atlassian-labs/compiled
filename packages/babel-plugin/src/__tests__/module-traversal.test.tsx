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
    cwd: process.cwd() + '/packages/babel-plugin/src/__tests__/',
    filename: 'index.js',
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
});
