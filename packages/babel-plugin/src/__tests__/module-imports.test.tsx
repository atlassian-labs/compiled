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
  it('should retain default import', () => {
    const actual = transform(`
      import defaultImport from '@compiled/core';
      import React from 'react';

      <div css={{}} />
    `);

    expect(actual).toInclude('defaultImport');
  });

  it('should add react import if missing', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude(`import*as React from'react'`);
  });

  it('should do nothing if react default import is already defined', () => {
    const actual = transform(`
      import React from 'react';
      import { styled } from '@compiled/core';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude("import React from'react';");
  });

  it('should retain named imports from react when adding missing react import', () => {
    const actual = transform(`
      import { useState } from 'react';
      import { styled } from '@compiled/core';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude(`import*as React from'react';import{useState}from'react';`);
  });

  it('should transform with a rebound named import', () => {
    const actual = transform(`
      import { styled as styledFunction, ThemeProvider } from '@compiled/core';

      const ListItem = styledFunction.div({
        fontSize: '20px',
      });
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import*as React from'react';import{ThemeProvider,ax,CC,CS}from'@compiled/core';const ListItem=React.forwardRef(({as:C=\\"div\\",style,...props},ref)=><CC>
            <CS hash=\\"hash-test\\">{[\\".cc-hash-test{font-size:20px}\\"]}</CS>
            <C{...props}style={style}ref={ref}className={ax([\\"cc-hash-test\\",props.className])}/>
          </CC>);"
    `);
  });
});
