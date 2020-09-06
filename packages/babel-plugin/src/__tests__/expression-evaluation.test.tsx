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
    plugins: [babelPlugin],
  })?.code;
};

describe('import specifiers', () => {
  it('should evaluate simple expressions', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      <div css={{ fontSize: 8 * 2 }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:16px}');
  });

  it('should bail out evaluating expression referencing a mutable identifier', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      let mutable = 2;
      mutable = 1;

      <div css={{ fontSize: mutable }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
  });

  it('should bail out evaluating identifier expression referencing a mutated identifier', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      let mutable = 2;
      const dontchange = mutable;
      mutable = 3;

      <div css={{ fontSize: dontchange }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
  });

  it('should not exhaust the stack when an identifier references itself', () => {
    expect(() => {
      transform(`
      import '@compiled/core';
      import React from 'react';

      let heading = heading || 20;

      <div css={{ marginLeft: \`\${heading.depth}rem\`, color: 'red' }}>hello world</div>
    `);
    }).not.toThrow();
  });

  it('should bail out evaluating expression that references a constant expression referencing a mutated expression', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      let mutable = false;
      const dontchange = mutable ? 1 : 2;
      mutable = true;

      <div css={{ fontSize: dontchange }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
  });

  it('should bail out evaluating a binary expression referencing a mutated identifier', () => {
    const actual = transform(`
      import '@compiled/core';
      import React from 'react';

      let mutable = 2;
      mutable = 3;

      <div css={{ fontSize: mutable * 2 }}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
  });
});
