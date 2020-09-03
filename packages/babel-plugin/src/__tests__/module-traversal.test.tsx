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
  it('should replace an identifier referencing an import specifier with the node', () => {
    const result = transform(
      `
      import '@compiled/core';
      import React from 'react';
      import colors from './stubs/colors';

      <div css={{ color: colors.primary }} />
    `
    );

    expect(result).toInclude('.cc-hash-test{color:blue}');
  });
});
