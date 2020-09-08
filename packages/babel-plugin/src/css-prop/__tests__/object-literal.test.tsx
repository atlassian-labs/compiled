import { transformSync } from '@babel/core';
import babelPlugin from '../../index';

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

describe('css prop object literal', () => {
  it('should inline the variable when it is a constant in string css', () => {
    const actual = transform(`
        import '@compiled/core';

        const bg = 'blue';
        let cl = 'red';
        cl = 'red';

        <div css={{ background: bg, color: cl, textDecoration: 'none', }}>hello world</div>
      `);

    expect(actual).toInclude(
      '.cc-hash-test{background:blue;color:var(--var-hash-test);text-decoration:none'
    );
    expect(actual).toInclude('style={{"--var-hash-test":cl}}');
  });

  it('should inline constant variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const fontSize = 20;

        <div css={{ fontSize: \`\${fontSize}px\` }}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{font-size:20px}');
  });

  it('should inline constant object property value', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const colors = { error: 'red' };

        <div css={{ color: colors.error }}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:red}');
  });

  it('should inline nested constant object property value', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const theme = {
          colors: {
            light: {
              primary: '#fff',
            }
          }
        };

        <div css={{ color: theme.colors.light.primary }}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:#fff}');
  });

  it('should persist suffix of dynamic property value from objects into inline styles', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        let heading = {
          depth: 20
        };
        heading = {};

        <div css={{ marginLeft: \`\${heading.depth}rem\`, color: 'red' }}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{margin-left:var(--var-hash-test);color:red}');
    expect(actual).toInclude('style={{"--var-hash-test":(heading.depth||"")+"rem"}}');
  });

  it('should persist prefix of dynamic property value into inline styles', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        let fontSize = 20;
        fontSize = 20;

        <div css={{ fontSize: \`calc(100% - \${fontSize}px)\`, color: 'red' }}>hello world</div>
      `);

    expect(actual).toInclude(
      '.cc-hash-test{font-size:calc(100% - var(--var-hash-test));color:red}'
    );
    expect(actual).toInclude('style={{"--var-hash-test":(fontSize||"")+"px"}}');
  });

  it('should move prefix of grouped interpolation into inline styles', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        let heading = header || {
          depth: 20
        };

        <div css={{ marginLeft: \`calc(100% - \${heading.depth}rem)\` }}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{margin-left:calc(100% - var(--var-hash-test))}');
    expect(actual).toInclude('style={{"--var-hash-test":(heading.depth||"")+"rem"}}');
  });

  it('should move multiple groups of interpolations into inline styles', () => {
    // See: https://codesandbox.io/s/dank-star-443ps?file=/src/index.js
    const actual = transform(`
        import '@compiled/core';

        const N30 = 'gray';

        <div css={\`
          background-image: linear-gradient(45deg, \${N30} 25%, transparent 25%),
            linear-gradient(-45deg, \${N30} 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, \${N30} 75%),
            linear-gradient(-45deg, transparent 75%, \${N30} 75%);
        \`}>hello world</div>
      `);

    expect(actual).toInclude(
      'background-image:linear-gradient(45deg,gray 25%,transparent 25%),linear-gradient(-45deg,gray 25%,transparent 25%),linear-gradient(45deg,transparent 75%,gray 75%),linear-gradient(-45deg,transparent 75%,gray 75%)'
    );
  });

  it('should move multiple groups of interpolations into inline styles with css variable for dynamic value', () => {
    // See: https://codesandbox.io/s/dank-star-443ps?file=/src/index.js
    const actual = transform(`
        import '@compiled/core';
        import {useState} from 'react';

        let N30 = 'gray';
        N30 = 'gray';

        <div css={\`
          background-image: linear-gradient(45deg, \${N30} 25%, transparent 25%),
            linear-gradient(-45deg, \${N30} 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, \${N30} 75%),
            linear-gradient(-45deg, transparent 75%, \${N30} 75%);
        \`}>hello world</div>
      `);

    expect(actual).toInclude('style={{"--var-hash-test":N30}}');
    expect(actual).toInclude(
      'background-image:linear-gradient(45deg,var(--var-hash-test) 25%,transparent 25%),linear-gradient(-45deg,var(--var-hash-test) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,var(--var-hash-test) 75%),linear-gradient(-45deg,transparent 75%,var(--var-hash-test) 75%)'
    );
  });

  it('should transform object with simple values', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        <div css={{ lineHeight: 20, color: 'blue' }}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{line-height:20;color:blue}');
  });

  it('should inline constant', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const fontSize = 12;

        <div css={{ fontSize: \`\${fontSize}px\` }}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{font-size:12px}');
  });

  it('should transform object with nested object into a selector', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        <div css={{ ':hover': { color: 'blue' } }}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test:hover{color:blue}');
  });

  it('should transform object that has a variable reference', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        let blue = 'blue';
        blue = 'blue';

        <div css={{ color: blue }}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
    expect(actual).toInclude('style={{"--var-hash-test":blue}}');
  });

  it('should transform object that has a destructured variable reference', () => {
    const actual = transform(`
        import '@compiled/core';
        import { useState } from 'react';
        import React from 'react';

        const [color, setColor] = useState('blue');
        <div css={{ color }}>hello world</div>
      `);

    expect(actual).toInclude('style={{"--var-hash-test":color}}');
    expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
  });

  it('should transform object spread from variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = { color: 'red' };
        <div css={{ color: 'blue', ...mixin }}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:blue;color:red}');
  });

  it('should transform object with string variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const text = 'red';

        <div css={{ color: text }}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:red}');
  });

  it('should transform object with string variable using shorthand notation', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const color = 'red';

        <div css={{ color }}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:red}');
  });

  it('should transform object with obj variable', () => {
    const actual = transform(`
        import '@compiled/core';
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

    expect(actual).toInclude('.cc-hash-test{display:flex;font-size:50px;color:blue}');
    expect(actual).toInclude('.cc-hash-test:hover{color:red}');
  });

  xit('should transform object with no argument arrow function variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

    expect(actual).toInclude(`.css-test{color:blue;color:red}`);
  });

  it('should transform template literal value', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        <div css={{ color: \`blue\` }}>hello world</div>
      `);

    expect(actual).toInclude(`.cc-hash-test{color:blue}`);
  });

  xit('should transform object spread with no argument arrow function variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

    expect(actual).toInclude('.css-test{color:blue;color:red}');
  });

  it('should transform inline template literal with suffix', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const gridSize = 4;
        const Div = () => <div css={{
          padding: \`0 \${gridSize}px\`,
          color: 'red',
        }} />;
      `);

    expect(actual).toInclude('.cc-hash-test{padding:0 4px;color:red}');
  });

  xit('should transform object spread with no argument function variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

    expect(actual).toInclude(`.css-test{color:blue;color:red}`);
  });

  xit('should transform object with no argument arrow function', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = () => ({ color: 'red' });

        <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
      `);

    expect(actual).toInclude(`.css-test{color:blue}`);
    expect(actual).toInclude('.css-test:hover{color:red}');
  });

  it('should extract mixin from identifier', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const base = { color: 'red' };

        <div css={base}>hello world</div>
      `);

    expect(actual).toInclude(`.cc-hash-test{color:red}`);
  });

  it('should transform identifier referencing an template literal', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const base = \`
          color: red;
        \`;

        <div css={base}>hello world</div>
      `);

    expect(actual).toInclude(`.cc-hash-test{color:red}`);
  });

  xit('should transform object with no argument function variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ':hover': mixin() }}>hello world</div>
      `);

    expect(actual).toInclude(`.css-test{color:blue}`);
    expect(actual).toInclude('.css-test:hover{color:red}');
  });

  xit('should transform object spread with no argument function variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        function mixin() {
          return { color: 'red' };
        }

        <div css={{ color: 'blue', ...mixin() }}>hello world</div>
      `);

    expect(actual).toInclude('.css-test{color:blue;color:red}');
  });

  xit('should transform object with argument arrow function variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = (color: string) => ({ color });
        const color = 'red';

        <div css={{ color: 'blue', ...mixin(color) }}>hello world</div>
      `);

    expect(actual).toInclude('.css-test{color:blue;color:red}');
  });

  it('should parse an inline string interpolation delimited by spaces', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const gridSize = () => 8;
        const HORIZONTAL_SPACING = \`\${gridSize() / 2}px\`;

        <div css={{
          padding: \`0 \${HORIZONTAL_SPACING}\`,
          color: 'red',
         }}>hello world</div>
      `);

    expect(actual).toInclude('style={{"--var-hash-test":HORIZONTAL_SPACING}}');
    expect(actual).toInclude('.cc-hash-test{padding:0 var(--var-hash-test);color:red}');
  });

  it('should parse an inline string interpolation delimited by multiple spaces', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const gridSize = () => 8;
        const HORIZONTAL_SPACING = \`\${gridSize() / 2}px\`;

        <div css={{
          padding: \`0 \${HORIZONTAL_SPACING} 0 0\`,
          color: 'red',
         }}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{padding:0 var(--var-hash-test) 0 0;color:red}');
    expect(actual).toInclude('style={{"--var-hash-test":HORIZONTAL_SPACING}}');
  });

  it('should parse an inline string interpolation delimited by multiple spaces and suffix', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const gridSize = () => 8;
        const HORIZONTAL_SPACING = gridSize();

        <div css={{
          padding: \`0 \${HORIZONTAL_SPACING}px 0 0\`,
          color: 'red',
         }}>hello world</div>
      `);

    expect(actual).toInclude('style={{"--var-hash-test":(HORIZONTAL_SPACING||"")+"px"}}');
    expect(actual).toInclude('.cc-hash-test{padding:0 var(--var-hash-test) 0 0;color:red}');
  });

  it('should parse an inline string interpolation delimited by multiple spaces and multiple suffix', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const gridSize = () => 8;
        const HORIZONTAL_SPACING = gridSize();

        <div css={{
          padding: \`\${HORIZONTAL_SPACING}px \${HORIZONTAL_SPACING}px \${HORIZONTAL_SPACING}px \${HORIZONTAL_SPACING}px\`,
          color: 'red',
         }}>hello world</div>
      `);

    expect(actual).toInclude('style={{"--var-hash-test":(HORIZONTAL_SPACING||"")+"px"}}');
    expect(actual).toInclude(
      '.cc-hash-test{padding:var(--var-hash-test) var(--var-hash-test) var(--var-hash-test) var(--var-hash-test);color:red}'
    );
  });

  it('should do nothing when content already has single quotes', () => {
    const actual = transform(`
        import '@compiled/core';

        const yeah = true;
        <div css={{ content: "'hello'" }}>hello world</div>
      `);

    expect(actual).toInclude(`.cc-hash-test{content:'hello'}`);
  });

  it('should do nothing when content already has double quotes', () => {
    const actual = transform(`
        import '@compiled/core';

        const yeah = true;
        <div css={{ content: '"hello"' }}>hello world</div>
      `);

    expect(actual).toInclude(`.cc-hash-test{content:\\\"hello\\\"}`);
  });

  it('should add quotations to static content if missing', () => {
    const actual = transform(`
        import '@compiled/core';

        const yeah = true;
        <div css={{ content: 'hello' }}>hello world</div>
      `);

    expect(actual).toInclude(`.cc-hash-test{content:\\\"hello\\\"}`);
  });
});
