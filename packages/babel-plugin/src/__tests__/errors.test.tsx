import { transformSync } from '@babel/core';
import babelPlugin from '../index';

const transform = (code: string) => {
  return transformSync(code, {
    configFile: false,
    babelrc: false,
    compact: true,
    plugins: [babelPlugin],
    // Turn off code highlighting so snapshots are human readable.
    highlightCode: false,
  })?.code;
};

describe('error handling', () => {
  it('should throw when using using an invalid css node', () => {
    expect(() => {
      transform(`
      import '@compiled/react';
      import React from 'react';

      <div css={() => {}} />
    `);
    }).toThrowErrorMatchingSnapshot();
  });

  it('should throw when spreading an identifier that does not exist', () => {
    expect(() => {
      transform(`
      import '@compiled/react';
      import React from 'react';

      <div css={{ ...dontexist }} />
    `);
    }).toThrowErrorMatchingSnapshot();
  });

  it('should throw when referencing an identifier that does not exist', () => {
    expect(() => {
      transform(`
      import '@compiled/react';
      import React from 'react';

      <div css={dontexist} />
    `);
    }).toThrowErrorMatchingSnapshot();
  });

  it('should throw when referencing an identifier that isnt supported', () => {
    expect(() => {
      transform(`
      import '@compiled/react';
      import React from 'react';

      class HelloWorld {}

      <div css={HelloWorld} />
    `);
    }).toThrowErrorMatchingSnapshot();
  });

  it('should throw when composing invalid css', () => {
    expect(() => {
      transform(`
      import '@compiled/react';
      import React from 'react';

      <div css={[...hello]} />
    `);
    }).toThrowErrorMatchingSnapshot();
  });
});
