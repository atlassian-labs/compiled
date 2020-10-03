import { transformSync } from '@babel/core';
import babelPlugin from '../../index';

const transform = (code: string) => {
  return transformSync(code, {
    configFile: false,
    babelrc: false,
    compact: true,
    plugins: [babelPlugin],
  })?.code;
};

describe('styled component behaviour', () => {
  it('should generate styled object component code', () => {
    const actual = transform(`
      import { styled, ThemeProvider } from '@compiled/core';

      const ListItem = styled.div({
        fontSize: '20px',
      });
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import*as React from'react';import{ThemeProvider,ax,CC,CS}from'@compiled/core';const _=\\"._36l6gktf{font-size:20px}\\";const ListItem=React.forwardRef(({as:C=\\"div\\",style,...props},ref)=><CC>
            <CS>{[_]}</CS>
            <C{...props}style={style}ref={ref}className={ax([\\"_36l6gktf\\",props.className])}/>
          </CC>);"
    `);
  });

  it('should generate styled template literal component code', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import*as React from'react';import{ax,CC,CS}from'@compiled/core';const _=\\"._36l6gktf{font-size:20px}\\";const ListItem=React.forwardRef(({as:C=\\"div\\",style,...props},ref)=><CC>
            <CS>{[_]}</CS>
            <C{...props}style={style}ref={ref}className={ax([\\"_36l6gktf\\",props.className])}/>
          </CC>);"
    `);
  });

  it('should compose CSS from multiple sources', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const styles = { fontSize: 12 };

      const ListItem = styled.div([
        styles,
        \`color: blue;\`,
        { fontWeight: 500 }
      ]);
    `);

    expect(actual).toInclude('{font-size:12px}');
    expect(actual).toInclude('{color:blue}');
    expect(actual).toInclude('{font-weight:500}');
  });

  it('should not pass down invalid html attributes to the node', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';
      const ListItem = styled.div({
        fontSize: props => props.textSize,
      });
    `);

    expect(actual).toInclude('textSize,...props');
    expect(actual).toInclude('"--var-fb92co":textSize');
  });

  it('should remove styled import', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';
      const ListItem = styled.div({
        fontSize: '20px',
      });
    `);

    expect(actual).not.toInclude(`import { styled } from '@compiled/core';`);
  });

  it('should replace string literal styled component with component', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import*as React from'react';import{ax,CC,CS}from'@compiled/core';const _=\\"._36l6gktf{font-size:20px}\\";const ListItem=React.forwardRef(({as:C=\\"div\\",style,...props},ref)=><CC>
            <CS>{[_]}</CS>
            <C{...props}style={style}ref={ref}className={ax([\\"_36l6gktf\\",props.className])}/>
          </CC>);"
    `);
  });

  it('should add an identifier nonce to the style element', () => {
    const actual = transformSync(
      `
      import { styled } from '@compiled/core';

      const ListItem = styled.div\`
        font-size: \${props => props.color}px;
      \`;
      `,
      {
        configFile: false,
        babelrc: false,
        compact: true,
        plugins: [[babelPlugin, { nonce: '__webpack_nonce__' }]],
      }
    )?.code;

    expect(actual).toInclude('<CS nonce={__webpack_nonce__}');
  });

  it('should shortcircuit props with suffix to a empty string to avoid undefined in css', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div\`
        font-size: \${props => props.color}px;
      \`;
    `);

    expect(actual).toInclude('"--var-1p69eoh":(props.color||"")+"px"');
  });

  it('should spread down props to element', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('<C{...props}');
  });

  it('should compose a component using template literal', () => {
    const actual = transform(`
      import React from 'react';
      import { styled } from '@compiled/core';

      const Component = () => null;

      const ListItem = styled(Component)\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('as:C=Component');
  });

  it('should compose a component using object literal', () => {
    const actual = transform(`
      import React from 'react';
      import { styled } from '@compiled/core';

      const Component = () => null;

      const ListItem = styled(Component)({
        fontSize: 20
      });
    `);

    expect(actual).toInclude('as:C=Component');
  });

  it('should concat class name prop if defined', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';
      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude(`className={ax([\"_36l6gktf\",props.className])}`);
  });

  it('should inline constant identifier string literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const fontSize = '20px';

      const ListItem = styled.div\`
        font-size: \${fontSize};
      \`;
    `);

    expect(actual).toInclude('{font-size:20px}');
  });

  it('should transform an arrow function with a body into an IIFE', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div({
        color: props => { return props.color; },
      });
    `);

    expect(actual).toInclude('{color:var(--var-1poneq5)}');
    expect(actual).toInclude('"--var-1poneq5":(()=>{return props.color;})()}}');
  });

  it('should transform an arrow function with a body into an IIFE by preventing passing down invalid html attributes to the node', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div({
        fontSize: props => { return props.textSize; },
      });
    `);

    expect(actual).toInclude('{font-size:var(--var-1j0t240)}');
    expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
    expect(actual).toInclude('"--var-1j0t240":(()=>{return textSize;})()}}');
  });

  it('should move suffix and prefix of a dynamic arrow function with a body into an IIFE', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div({
        color: \`very$\{props => { return props.color; }}dark\`
      });
    `);

    expect(actual).toInclude('{color:var(--var-1poneq5)}');
    expect(actual).toInclude('"--var-1poneq5":"very"+((()=>{return props.color;})()||"")+"dark"');
  });

  it('should move suffix and prefix of a dynamic arrow function with a body into an IIFE by preventing passing down invalid html attributes to the node', () => {
    const actual = transform(`
      import { styled } from '@compiled/core';

      const ListItem = styled.div({
        fontSize: \`super$\{props => { return props.textSize; }}big\`
      });
    `);

    expect(actual).toInclude('{font-size:var(--var-1j0t240)}');
    expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
    expect(actual).toInclude('"--var-1j0t240":"super"+((()=>{return textSize;})()||"")+"big"');
  });
});
