import * as ts from 'typescript';
import { Transformer } from 'ts-transformer-testing-library';
import cssPropTransformer from '../index';

jest.mock('../../utils/hash');

const transformer = new Transformer()
  .addTransformer(cssPropTransformer)
  .addMock({ name: '@compiled/css-in-js', content: `export const jsx: any = () => null` })
  .addMock({
    name: 'react',
    content: `export default {} as any; export const useState = {} as any;`,
  })
  .setFilePath('/index.tsx');

describe('css prop transformer', () => {
  it('should transform a self closing element', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      <div css={{}} />
    `);

    expect(actual).toInclude('<div className="css-test"/>');
  });

  it('should replace css prop with class name', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toInclude('<div className="css-test">hello world</div>');
  });

  it('should add react default import if missing', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toInclude(`import React from \'react\';`);
  });

  it('should ensure Style has been imported', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toIncludeRepeated(`import { CC, CS } from '@compiled/css-in-js';`, 1);
  });

  it('should pass through style identifier when there is no dynamic styles in the css', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      const Component = ({ className, style }) => <div className={className} style={style} css={{ fontSize: 12 }}>hello world</div>;
    `);

    expect(actual).toInclude('style={style}');
  });

  it('should pass through style property access when there is no dynamic styles in the css', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      const Component = ({ className, ...props }) => <div className={className} style={props.style} css={{ fontSize: 12 }}>hello world</div>;
    `);

    expect(actual).toInclude('style={props.style}');
  });

  it('should spread style identifier when there is dynamic styles in the css', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';
      const [fontSize] = React.useState('10px');
      const red = 'red';

      const Component = ({ className, style }) => <div className={className} style={style} css={{ fontSize, color: red }}>hello world</div>;
    `);

    expect(actual).toInclude(
      '<div className={"css-test" + (className ? " " + className : "")} style={{ ...style, "--var-test-fontsize": fontSize }}>hello world</div>'
    );
    expect(actual).toInclude('.css-test{font-size:var(--var-test-fontsize);color:red}');
  });

  it('should spread style property access when there is dynamic styles in the css', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';
      const [background] = React.useState("violet");
      const red = 'red';
      const Component = ({ className, ...props }) => <div className={className} style={props.style} css={{ fontSize: 12, color: red, background }}>hello world</div>;
    `);

    expect(actual).toInclude('style={{ ...props.style, "--var-test-background": background }}');
    expect(actual).toInclude(
      '.css-test{font-size:12px;color:red;background:var(--var-test-background)}'
    );
  });

  it('should spread style identifier when there is styles already set', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      const Component = ({ className, style }) => <div className={className} style={{ ...style, display: 'block' }} css={{ fontSize: 12 }}>hello world</div>;
    `);

    expect(actual).toInclude(`style={{ ...style, display: 'block' }}`);
  });

  it('should spread style identifier when there is styles already set and using dynamic css', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      const [background] = React.useState('yellow');
      const red = 'red';
      const Component = ({ className, style }) => <div className={className} style={{ ...style, display: 'block' }} css={{ fontSize: 12, color: red, background }}>hello world</div>;
    `);

    expect(actual).toInclude(
      `style={{ ...style, display: 'block', "--var-test-background": background }}`
    );
    expect(actual).toInclude(
      `.css-test{font-size:12px;color:red;background:var(--var-test-background)}`
    );
  });

  it('should compose class name from parent and pass down css variables in style', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toIncludeRepeated(`import React from 'react';`, 1);
  });

  it('should add react default import if it only has named imports', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import { useState } from 'react';
      import React from 'react';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toIncludeRepeated("import React, { useState } from 'react'", 1);
  });

  it('should concat explicit use of class name prop on an element', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      <div className="foobar" css={{}}>hello world</div>
    `);

    expect(actual).toInclude('className={"css-test" + " " + "foobar"}');
  });

  it('should pass through spread props', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      const props = {};

      <div
        css={{
          fontSize: 20,
        }}
        {...props}
      />
    `);

    expect(actual).toInclude('<div {...props} className="css-test"/>');
  });

  it('should pass through static props', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      <div
        css={{
          fontSize: 20,
        }}
        role="menu"
      />
    `);

    expect(actual).toInclude('<div role="menu" className="css-test"/>');
  });

  it('should concat explicit use of class name prop from an identifier on an element', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      const className = "foobar";
      <div className={className} css={{}}>hello world</div>
    `);

    expect(actual).toInclude('className={"css-test" + (className ? " " + className : "")}');
  });

  it('should pick up array composition', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      const base = { color: 'black' };
      const top = \` color: red; \`;

      <div css={[base, top]}>hello world</div>
    `);

    expect(actual).toInclude('.css-test{color:black;color:red}');
  });

  it('should concat explicit use of style prop on an element', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      const color = 'blue';
      <div style={{ display: 'block' }} css={{ color: color }}>hello world</div>
    `);

    expect(actual).toInclude(`.css-test{color:blue}`);
    expect(actual).toInclude(
      '<div className="css-test" style={{ display: \'block\' }}>hello world</div>'
    );
  });

  it('should concat explicit use of style prop on an element when destructured template', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      const [color] = ['blue'];
      <div style={{ display: 'block' }} css={{ color: \`\${color}\` }}>hello world</div>
    `);

    expect(actual).toInclude(`style={{ display: 'block', \"--var-test-color\": color }}`);
  });

  it('should pass through style prop when not using dynamic css', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      <div style={{ display: 'block' }} css={{}}>hello world</div>
    `);

    expect(actual).toInclude(`style={{ display: 'block' }}`);
  });

  it('should concat implicit use of class name prop where class name is a jsx expression', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      const getFoo = () => 'foobar';

      <div css={{}} className={getFoo()}>hello world</div>
    `);

    expect(actual).toInclude('className={"css-test" + (getFoo() ? " " + getFoo() : "")}');
  });

  it('should allow inlined expressions as property values', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';

      const hello = true;

      <div css={{ color: hello ? 'red' : 'blue' }}>hello world</div>
    `);

    expect(actual).toInclude('color:var(--var-test-hello)');
    expect(actual).toInclude(`style={{ "--var-test-hello": hello ? 'red' : 'blue' }}`);
  });

  it('should move multiple groups of interpolations into inline styles', () => {
    // See: https://codesandbox.io/s/dank-star-443ps?file=/src/index.js
    const actual = transformer.transform(`
      import '@compiled/css-in-js';

      const N30 = 'gray';

      <div css={{
        backgroundImage: \`linear-gradient(45deg, \${N30} 25%, transparent 25%),
        linear-gradient(-45deg, \${N30} 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, \${N30} 75%),
        linear-gradient(-45deg, transparent 75%, \${N30} 75%)\`
      }}>hello world</div>
    `);

    expect(actual).toInclude(
      `background-image:linear-gradient(45deg,gray 25%,transparent 25%),linear-gradient(-45deg,gray 25%,transparent 25%),linear-gradient(45deg,transparent 75%,gray 75%),linear-gradient(-45deg,transparent 75%,gray 75%)`
    );
    expect(actual).toInclude('<div className="css-test">hello world</div>');
  });

  it('should move multiple groups of interpolations into inline styles with css variable', () => {
    // See: https://codesandbox.io/s/dank-star-443ps?file=/src/index.js
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import {useState} from 'react';

      const [N30] = useState('gray');

      <div css={{
        backgroundImage: \`linear-gradient(45deg, \${N30} 25%, transparent 25%),
        linear-gradient(-45deg, \${N30} 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, \${N30} 75%),
        linear-gradient(-45deg, transparent 75%, \${N30} 75%)\`
      }}>hello world</div>
    `);

    expect(actual).toInclude(
      `background-image:linear-gradient(45deg,var(--var-test-n30) 25%,transparent 25%),linear-gradient(-45deg,var(--var-test-n30) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,var(--var-test-n30) 75%),linear-gradient(-45deg,transparent 75%,var(--var-test-n30) 75%)`
    );
    expect(actual).toInclude(
      '<div className="css-test" style={{ "--var-test-n30": N30 }}>hello world</div>'
    );
  });

  it('should allow expressions stored in a variable as shorthand property values', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';

      const hello = true;
      const color = hello ? 'red' : 'blue' ;
      <div css={{ color }}>hello world</div>
    `);

    expect(actual).toInclude('color:var(--var-test-color)');
    expect(actual).toInclude(`style={{ "--var-test-color": color }}`);
  });

  it('should allow expressions stored in a variable as property values', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';

      const hello = true;
      const colorsz = hello ? 'red' : 'blue' ;
      <div css={{ color: colorsz }}>hello world</div>
    `);

    expect(actual).toInclude('color:var(--var-test-colorsz)');
    expect(actual).toInclude(`style={{ "--var-test-colorsz": colorsz }}`);
  });

  it('should remove css prop', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      const color = 'blue';

      <div css={{ color: color }} style={{ display: "block" }}>hello world</div>
    `);

    expect(actual).not.toInclude('css={');
  });

  it('should keep other props around', () => {
    const actual = transformer.transform(`
      import '@compiled/css-in-js';
      import React from 'react';

      const color = 'blue';

      <div data-testid="yo" css={{ color: color }} style={{ display: "block" }}>hello world</div>
    `);

    expect(actual).toInclude('data-testid="yo"');
  });

  it('should add an identifier nonce to the style element', () => {
    const stubProgam: ts.Program = ({
      getTypeChecker: () => ({
        getSymbolAtLocation: () => undefined,
      }),
    } as never) as ts.Program;
    const transformer = cssPropTransformer(stubProgam, { nonce: '__webpack_nonce__' });

    const actual = ts.transpileModule(
      `
        import '@compiled/css-in-js';
        import React from 'react';

        const color = 'blue';

        <div data-testid="yo" css={{ color: color }} style={{ display: "block" }}>hello world</div>
      `,
      {
        transformers: { before: [transformer] },
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.Preserve,
          target: ts.ScriptTarget.ESNext,
        },
      }
    );

    expect(actual.outputText).toInclude('<CS hash="css-test" nonce={__webpack_nonce__}>');
  });

  it('should bubble up top level pseduo inside a media atrule', () => {
    const actual = transformer.transform(`
    import '@compiled/css-in-js';
    import React from 'react';

    const fontSize = 20;

    <div css={\`
      @media screen {
        :hover {
          color: red;
        }
      }
    \`}>hello world</div>
  `);

    expect(actual).toInclude('.css-test:hover{color:red}}');
  });

  it('should bubble up top level pseduo inside a support atrule', () => {
    const actual = transformer.transform(`
    import '@compiled/css-in-js';
    import React from 'react';

    const fontSize = 20;

    <div css={\`
      @supports (display: grid) {
        :hover {
          color: red;
        }
      }
    \`}>hello world</div>
  `);

    expect(actual).toInclude('.css-test:hover{color:red}}');
  });

  it.todo('should concat implicit use of style prop where props are spread into an element');

  describe('using strings', () => {
    it('should persist suffix of dynamic property value into inline styles', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const fontSize = 20;

        <div css={\`font-size: \${fontSize}px;\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
      expect(actual).toInclude('<div className="css-test">hello world</div>');
    });

    it('should transform string literal', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        <div css="font-size: 20px;">hello world</div>
    `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    it('should transform binary expression', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';

        export const EmphasisText = (props) => (
          <span
            css={\`
              color: $\{props.color};
              text-transform: uppercase;
              font-weight: 600;
            \`}>{props.children}</span>
        );
      `);

      expect(actual).toInclude(
        '.css-test{color:var(--var-test-propscolor);text-transform:uppercase;font-weight:600}'
      );
      expect(actual).toInclude(
        '<span className="css-test" style={{ "--var-test-propscolor": props.color }}>{props.children}</span>'
      );
    });

    it('should transform no template string literal', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        <div css={\`font-size: 20px;\`}>hello world</div>
    `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    it('should transform template string literal with string variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const color = 'blue';
        <div css={\`color: \${color};\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue}');
      expect(actual).toInclude('<div className="css-test">hello world</div>');
    });

    it('should transform an expression', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const sidenav = true;
        <div
          css={\`
            display: grid;
            grid-template-areas: $\{
              sidenav ? "'header header' 'sidebar content'" : "'header header' 'content content'"
            };
          \`}
        >
          hello world
        </div>
      `);

      expect(actual).toInclude('grid-template-areas:var(--var-test-sidenav)');
      expect(actual).toInclude(
        `\"--var-test-sidenav\": sidenav ? \"'header header' 'sidebar content'\" : \"'header header' 'content content'\"`
      );
    });

    it('should transform template string literal with obj variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const style = { color: 'blue', fontSize: '30px' };
        <div css={\`\${style}\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;font-size:30px}');
    });

    it('should transform template string literal with obj import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const style = { color: 'blue', fontSize: '30px' };`,
      }).transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { style } from './mixins';

        <div
          css={\`
            :last-child {
              \${style};
            }
          \`}
          >
          hello world
        </div>
      `);

      expect(actual).toInclude('.css-test:last-child{color:blue;font-size:30px}');
    });

    it('should transform template string literal with obj import being used as a selector', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const style = { ':hover': { color: 'blue', fontSize: '30px' } };`,
      }).transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { style } from './mixins';

        <div css={\`\${style}\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test:hover{color:blue;font-size:30px}');
    });

    it.todo('should transform template string literal with array variable');

    it.todo('should transform template string literal with array import');

    it('should transform template string with no argument arrow function variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const style = () => ({ color: 'blue', fontSize: '30px' });
        <div css={\`\${style}\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;font-size:30px}');
    });

    it('should transform template string with no argument arrow function call variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const style = () => ({ color: 'blue', fontSize: '30px' });
        <div css={\`\${style()}\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;font-size:30px}');
    });

    it('should transform template string with no argument arrow function call import', () => {
      const actual = transformer.addSource({
        path: '/stylez.ts',
        contents: `export const style = () => ({ color: 'blue', fontSize: '30px' });`,
      }).transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { style } from './stylez';

        <div css={\`\${style()}\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;font-size:30px}');
    });

    it('should transform template string with no argument function variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        function mixin() {
          return { color: 'red' };
        }

        <div css={\`\${mixin()}\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    it('should transform template string with no argument function import', () => {
      const actual = transformer.addSource({
        path: '/func-mixin.ts',
        contents: `
          export function mixin() {
            return { color: 'red' };
          }
        `,
      }).transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { mixin } from './func-mixin';

        <div css={\`\${mixin()}\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    it.todo('should transform template string with argument function variable');

    it.todo('should transform template string with argument function import');

    xit('should transform template string with argument arrow function variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const style = (color: string) => ({ color, fontSize: '30px' });
        const primary = 'red';
        <div css={\`\${style(primary)}\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test);font-size:30px}');
      expect(actual).toInclude('style={{ "--var-test": primary }}');
    });

    it('should allow multiple interpolations inside a single css property', () => {
      const actual = transformer.transform(`
        import React from 'react';
        import '@compiled/css-in-js';

        const x = 1;
        const y = '2px';

        <div
          css={\`
            transform: translate3d(\${x}px, $\{y}, 0);
          \`}
        >
          hello world
        </div>
      `);
      expect(actual).toInclude('.css-test{transform:translate3d(1px,2px,0)}');
    });

    xit('should transform template string with argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/mixy-in.ts',
        contents: `export const style = (color: string) => ({ color, fontSize: '30px' });`,
      }).transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { style } from './mixy-in';

        const primary = 'red';
        <div css={\`\${style(primary)}\`}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:var(--var-test);font-size:30px}');
      expect(actual).toInclude('style={{ "--var-test": primary }}');
    });
  });

  describe('using an object literal', () => {
    it('should persist suffix of dynamic property value into inline styles', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const fontSize = 20;

        <div css={{ fontSize: \`\${fontSize}px\` }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
      expect(actual).toInclude('<div className="css-test">hello world</div>');
    });

    it('should persist suffix of dynamic property value from objects into inline styles', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const heading = {
          depth: 20
        };

        <div css={{ marginLeft: \`\${heading.depth}rem\` }}>hello world</div>
      `);

      expect(actual).toInclude(
        'style={{ "--var-test-headingdepth": (heading.depth || "") + "rem" }}'
      );
      expect(actual).toInclude('.css-test{margin-left:var(--var-test-headingdepth)}');
    });

    it('should persist prefix of dynamic property value into inline styles', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const fontSize = 20;

        <div css={{ fontSize: \`calc(100% - \${fontSize}px)\` }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{font-size:calc(100% - 20px)}');
      expect(actual).toInclude('<div className="css-test">hello world</div>');
    });

    it('should move prefix of grouped interpolation into inline styles', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const heading = {
          depth: 20
        };

        <div css={{ marginLeft: \`calc(100% - \${heading.depth}rem)\` }}>hello world</div>
      `);

      expect(actual).toInclude(
        'style={{ "--var-test-headingdepth": (heading.depth || "") + "rem" }}'
      );
      expect(actual).toInclude('.css-test{margin-left:calc(100% - var(--var-test-headingdepth))}');
    });

    it('should move multiple groups of interpolations into inline styles', () => {
      // See: https://codesandbox.io/s/dank-star-443ps?file=/src/index.js
      const actual = transformer.transform(`
        import '@compiled/css-in-js';

        const N30 = 'gray';

        <div css={\`
          background-image: linear-gradient(45deg, \${N30} 25%, transparent 25%),
            linear-gradient(-45deg, \${N30} 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, \${N30} 75%),
            linear-gradient(-45deg, transparent 75%, \${N30} 75%);
        \`}>hello world</div>
      `);

      expect(actual).toInclude('<div className="css-test">hello world</div>');
      expect(actual).toInclude(
        'background-image:linear-gradient(45deg,gray 25%,transparent 25%),linear-gradient(-45deg,gray 25%,transparent 25%),linear-gradient(45deg,transparent 75%,gray 75%),linear-gradient(-45deg,transparent 75%,gray 75%)'
      );
    });

    it('should move multiple groups of interpolations into inline styles with css variable for dynamic value', () => {
      // See: https://codesandbox.io/s/dank-star-443ps?file=/src/index.js
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import {useState} from 'react';

        const [N30] = useState('gray');

        <div css={\`
          background-image: linear-gradient(45deg, \${N30} 25%, transparent 25%),
            linear-gradient(-45deg, \${N30} 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, \${N30} 75%),
            linear-gradient(-45deg, transparent 75%, \${N30} 75%);
        \`}>hello world</div>
      `);

      expect(actual).toInclude(
        '<div className="css-test" style={{ "--var-test-n30": N30 }}>hello world</div>'
      );
      expect(actual).toInclude(
        'background-image:linear-gradient(45deg,var(--var-test-n30) 25%,transparent 25%),linear-gradient(-45deg,var(--var-test-n30) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,var(--var-test-n30) 75%),linear-gradient(-45deg,transparent 75%,var(--var-test-n30) 75%)'
      );
    });

    it('should transform object with simple values', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        <div css={{ lineHeight: 20, color: 'blue' }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{line-height:20;color:blue}');
    });

    it('should move right hand value (px, em, etc) after variable into style attribute', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const fontSize = 12;

        <div css={{ fontSize: \`\${fontSize}px\` }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{font-size:12px}');
      expect(actual).toInclude('<div className="css-test">hello world</div>');
    });

    it('should transform object with nested object into a selector', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        <div css={{ ':hover': { color: 'blue' } }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test:hover{color:blue}');
    });

    it('should transform object that has a variable reference', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const blue: string = 'blue';
        <div css={{ color: blue }}>hello world</div>
      `);

      expect(actual).toInclude('<div className="css-test">hello world</div>');
      expect(actual).toInclude('.css-test{color:blue}');
    });

    it('should transform object that has a destructured variable reference', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import { useState } from 'react';
        import React from 'react';

        const [color, setColor] = useState('blue');
        <div css={{ color }}>hello world</div>
      `);

      expect(actual).toInclude(
        '<div className="css-test" style={{ "--var-test-color": color }}>hello world</div>'
      );
      expect(actual).toInclude('.css-test{color:var(--var-test-color)}');
    });

    it('should transform object spread from variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const mixin = { color: 'red' };
        <div css={{ color: 'blue', ...mixin }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;color:red}');
    });

    it('should transform object spread from import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const mixin = { color: 'red' };`,
      }).transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ...mixin }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;color:red}');
    });

    it('should transform object with string variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const text = 'red';

        <div css={{ color: text }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:red}');
      expect(actual).toInclude('<div className="css-test">hello world</div>');
    });

    it('should transform object with string variable using shorthand notation', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const color = 'red';

        <div css={{ color }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:red}');
      expect(actual).toInclude('<div className="css-test">');
    });

    it('should transform object with string import', () => {
      const actual = transformer.addSource({
        path: '/colors.tsx',
        contents: `export const color = 'red';`,
      }).transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { color } from './colors';

        <div css={{ color }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:red}');
      expect(actual).toInclude('<div className="css-test">');
    });

    it('should transform object with obj variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const mixin = { color: 'red' };

        <div
          css={{
            display: 'flex',
            fontSize: '50px',
            color: 'blue',
            ':hover': mixin,
          }}>
          Hello, world!
        </div>
    `);

      expect(actual).toInclude('.css-test{display:flex;font-size:50px;color:blue}');
      expect(actual).toInclude('.css-test:hover{color:red}');
    });

    it('should transform object with obj import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: "export const mixin = { color: 'red' };",
      }).transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { mixin } from './mixins';

        <div
          css={{
            display: 'flex',
            fontSize: '50px',
            color: 'blue',
            ':hover': mixin,
          }}>
          Hello, world!
        </div>
    `);

      expect(actual).toInclude('.css-test{display:flex;font-size:50px;color:blue}');
      expect(actual).toInclude('.css-test:hover{color:red}');
    });

    it.todo('should transform object with array variable');

    it.todo('should transform object with array import');

    it('should transform object with no argument arrow function variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.css-test{color:blue;color:red}`);
    });

    it('should transform template literal value', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        <div css={{ color: \`blue\` }}>hello world</div>
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
    });

    it('should transform object with no argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const mixin = () => ({ color: 'red' });`,
      }).transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.css-test{color:blue;color:red}`);
    });

    it('should transform object spread with no argument arrow function variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;color:red}');
    });

    it('should transform object spread with no argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `export const mixin = () => ({ color: 'red' });`,
      }).transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;color:red}');
    });

    it('should transform inline template literal with suffix', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const gridSize = 4;
        const Div = () => <div css={{
          padding: \`0 \${gridSize}px\`,
          color: 'red',
        }} />;
      `);

      expect(actual).toInclude('<CS hash="css-test">{[".css-test{padding:0 4px;color:red}"]}</CS>');
    });

    it('should transform object spread with no argument function variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.css-test{color:blue;color:red}`);
    });

    it('should transform object with no argument arrow function', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
      expect(actual).toInclude('.css-test:hover{color:red}');
    });

    it('should transform identifier referencing an object', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const base = { color: 'red' };

        <div css={base}>hello world</div>
      `);

      expect(actual).toInclude(`.css-test{color:red}`);
    });

    it('should transform identifier referencing an template literal', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const base = \`
          color: red;
        \`;

        <div css={base}>hello world</div>
      `);

      expect(actual).toInclude(`.css-test{color:red}`);
    });

    it('should transform object with no argument function variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
      expect(actual).toInclude('.css-test:hover{color:red}');
    });

    it('should transform object with no argument function import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `
          export function mixin() {
            return { color: 'red' };
          }
        `,
      }).transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
      expect(actual).toInclude('.css-test:hover{color:red}');
    });

    it('should transform object spread with no argument function variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;color:red}');
    });

    it('should transform object spread with no argument function import', () => {
      const actual = transformer.addSource({
        path: '/mixins.ts',
        contents: `
          export function mixin() {
            return { color: 'red' };
          }
        `,
      }).transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { mixin } from './mixins';

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;color:red}');
    });

    it.todo('should transform object with argument function variable');

    it.todo('should transform object with argument function import');

    it('should transform object with argument arrow function variable', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const mixin = (color: string) => ({ color });
        const color = 'red';

        <div css={{ color: 'blue', ...mixin(color) }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;color:red}');
    });

    it('should parse an inline string interpolation delimited by spaces', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const gridSize = () => 8;
        const HORIZONTAL_SPACING = \`\${gridSize() / 2}px\`;

        <div css={{
          padding: \`0 \${HORIZONTAL_SPACING}\`,
          color: 'red',
         }}>hello world</div>
      `);

      expect(actual).toInclude('"--var-test-horizontal_spacing": HORIZONTAL_SPACING');
      expect(actual).toInclude('padding:0 var(--var-test-horizontal_spacing);');
    });

    it('should parse an inline string interpolation delimited by multiple spaces', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const gridSize = () => 8;
        const HORIZONTAL_SPACING = \`\${gridSize() / 2}px\`;

        <div css={{
          padding: \`0 \${HORIZONTAL_SPACING} 0 0\`,
          color: 'red',
         }}>hello world</div>
      `);

      expect(actual).toInclude('"--var-test-horizontal_spacing": HORIZONTAL_SPACING');
      expect(actual).toInclude('padding:0 var(--var-test-horizontal_spacing) 0 0;');
    });

    it('should parse an inline string interpolation delimited by multiple spaces and suffix', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const gridSize = () => 8;
        const HORIZONTAL_SPACING = gridSize();

        <div css={{
          padding: \`0 \${HORIZONTAL_SPACING}px 0 0\`,
          color: 'red',
         }}>hello world</div>
      `);

      expect(actual).toInclude(
        '"--var-test-horizontal_spacing": (HORIZONTAL_SPACING || "") + "px"'
      );
      expect(actual).toInclude('padding:0 var(--var-test-horizontal_spacing) 0 0;');
    });

    it('should parse an inline string interpolation delimited by multiple spaces and multiple suffix', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';
        import React from 'react';

        const gridSize = () => 8;
        const HORIZONTAL_SPACING = gridSize();

        <div css={{
          padding: \`\${HORIZONTAL_SPACING}px \${HORIZONTAL_SPACING}px \${HORIZONTAL_SPACING}px \${HORIZONTAL_SPACING}px\`,
          color: 'red',
         }}>hello world</div>
      `);

      expect(actual).toInclude(
        '"--var-test-horizontal_spacing": (HORIZONTAL_SPACING || "") + "px"'
      );
      expect(actual).toInclude(
        'padding:var(--var-test-horizontal_spacing) var(--var-test-horizontal_spacing) var(--var-test-horizontal_spacing) var(--var-test-horizontal_spacing);'
      );
    });

    it('should transform object with argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/styles.ts',
        contents: 'export const mixin = (color: string) => ({ color });',
      }).transform(`
        import '@compiled/css-in-js';
        import React from 'react';
        import { mixin } from './styles';

        const color = 'red';

        <div css={{ color: 'blue', ...mixin(color) }}>hello world</div>
      `);

      expect(actual).toInclude('.css-test{color:blue;color:red');
    });

    xit('should add quotations to dynamically set content', () => {
      const actual = transformer.transform(`
        import '@compiled/css-in-js';

        const yeah = true;
        <div css={{ content: yeah ? 'nah' : 'yeah' }}>hello world</div>
      `);

      expect(actual).toInclude(`"--var-test": '"' + (yeah ? 'nah' : 'yeah') + '"'`);
      expect(actual).toInclude('.css-test:after{content:var(--var-test)}');
    });
  });

  it("should inline the variable if it's a constant", () => {
    const actual = transformer.transform(`
        import '@compiled/css-in-js';

        const bg = 'blue';
        let cl = 'red';
        <div css={{ background: bg, color: cl }}>hello world</div>
      `);
    expect(actual).toInclude('.css-test{background:blue;color:var(--var-test-cl)}');
  });
});
