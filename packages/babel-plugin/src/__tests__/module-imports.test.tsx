import { transformSync } from '@babel/core';
import babelPlugin from '../index';

const transform = (code: string) => {
  return transformSync(code, {
    configFile: false,
    babelrc: false,
    compact: true,
    plugins: [babelPlugin],
  })?.code;
};

describe('import specifiers', () => {
  it('should remove entrypoint if no imports found', () => {
    const actual = transform(`
      import '@compiled/react';
      import React from 'react';

      <div css={{}} />
    `);

    expect(actual).not.toInclude(`'@compiled/react'`);
  });

  it('should remove react primary entrypoint if no named imports found', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      import React from 'react';

      <div css={{}} />
    `);

    expect(actual).not.toInclude(`'@compiled/react'`);
  });

  it('should add react import if missing', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude(`import*as React from'react'`);
  });

  it('should do nothing if react default import is already defined', () => {
    const actual = transform(`
      import React from 'react';
      import { styled } from '@compiled/react';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude("import React from'react';");
  });

  it('should retain named imports from react when adding missing react import', () => {
    const actual = transform(`
      import { useState } from 'react';
      import { styled } from '@compiled/react';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude(`import*as React from'react';import{useState}from'react';`);
  });

  it('should transform with a rebound named import', () => {
    const actual = transform(`
      import { styled as styledFunction } from '@compiled/react';

      const ListItem = styledFunction.div({
        fontSize: '20px',
      });
    `);

    expect(actual).toInclude(
      '<C{...props}style={style}ref={ref}className={ax(["_1wybgktf",props.className])}/>'
    );
  });

  it('should persist any exports not used ', () => {
    const actual = transform(`
      import { styled as styledFunction, ThemeNotUsedInTransform } from '@compiled/react';

      const ListItem = styledFunction.div({
        fontSize: '20px',
      });
    `);

    expect(actual).toInclude('ThemeNotUsedInTransform');
  });

  it('should import runtime from the runtime entrypoint', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        fontSize: '20px',
      });
    `);

    expect(actual).toInclude('import{ax,ix,CC,CS}from"@compiled/react/runtime";');
  });
});
