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

describe('css prop string literal', () => {
  it('should persist suffix of dynamic value into inline styles', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        let fontSize = 20;
        fontSize = 19;

        <div css={\`font-size: \${fontSize}px;color:red;\`}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test);color:red}');
    expect(actual).toInclude('style={{"--var-hash-test":(fontSize||"")+"px"}}');
  });

  it('should persist suffix of constant value', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const fontSize = 20;

        <div css={\`font-size: \${fontSize}px;\`}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{font-size:20px}');
  });

  it('should transform string literal', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        <div css="font-size: 20px;">hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:20px}');
  });

  it('should inline constant object property value', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const colors = { error: 'red' };

        <div
          css={\`
          color: \${colors.error};
        \`}>
          hello world
        </div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:red}');
  });

  it('should evaluate deep member expression referencing an identifier', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const primaryColor = 'blue';

        const theme = {
          colors: {
            light: {
              primary: primaryColor,
            },
            dark: {
              primary: 'black',
            },
          }
        };

        <div
          css={\`
          color: \${theme.colors.light.primary};
        \`}>
          hello world
        </div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:blue}');
  });

  it('should inline nested constant object property value', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const theme = {
          colors: {
            light: {
              primary: '#fff',
            },
            dark: {
              primary: 'black',
            },
          }
        };

        <div
          css={\`
          color: \${theme.colors.light.primary};
        \`}>
          hello world
        </div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:#fff}');
  });

  it('should transform binary expression', () => {
    const actual = transform(`
        import '@compiled/core';

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
      '.cc-hash-test{color:var(--var-hash-test);text-transform:uppercase;font-weight:600}'
    );
    expect(actual).toInclude('style={{"--var-hash-test":props.color}}');
  });

  it('should transform no template string literal', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        <div css={\`font-size: 20px;\`}>hello world</div>
    `);

    expect(actual).toInclude('.cc-hash-test{font-size:20px}');
  });

  it('should inline constant expression', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const color = 'blue';
        <div css={\`color: \${color};\`}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:blue}');
  });

  it('should transform an expression', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        let sidenav = true;
        sidenav = false;

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

    expect(actual).toInclude(
      '.cc-hash-test{display:grid;grid-template-areas:var(--var-hash-test)}'
    );
    expect(actual).toInclude(
      `\"--var-hash-test\":sidenav?\"'header header' 'sidebar content'\":\"'header header' 'content content'\"`
    );
  });

  it('should transform template string literal with obj variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const style = { color: 'blue', fontSize: '30px' };
        <div css={\`\${style};color: red;\`}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:blue;font-size:30px;color:red}');
  });

  it('should transform template string with no argument arrow function variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = () => ({ color: 'blue', fontSize: '30px' });
        <div css={\`\${mixin}\`}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:blue;font-size:30px}');
  });

  it('should transform template string with no argument arrow function call variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = () => ({ color: 'blue', fontSize: '30px' });
        <div css={\`\${mixin()}\`}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:blue;font-size:30px}');
  });

  it('should transform template string with no argument functions', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const color = () => 'blue';
        const fontStyling = {
          style: 'italic',
          family: 'sans-serif',
        };

        const mixin1 = function() { return fontStyling.style; };
        function mixin2() { return fontStyling.family; };

        <div css={\`
          color: blue;
          font-style: \${mixin1()};
          font-family: \${mixin2()};
          :hover { background-color: \${color()} };
        \`}>
          hello world
        </div>
      `);

    expect(actual).toInclude(`.cc-hash-test{color:blue;font-style:italic;font-family:sans-serif}`);
    expect(actual).toInclude('.cc-hash-test:hover{background-color:blue}');
  });

  it('should transform template string with no argument function properties belonging to a variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const fontSize = 12;
        const fontStyling = {
          weight: 500
        };

        const sizes = {
          mixin1: () => '1px solid black',
          mixin2: () => fontSize,
          mixin3: function() {return fontStyling.weight;}
        };

        <div css={\`
          color: blue;
          border: \${sizes.mixin1()};
          font-size: \${sizes.mixin2()}px;
          font-weight: \${sizes.mixin3()};
        \`}>
          hello world
        </div>
      `);

    expect(actual).toInclude(
      `.cc-hash-test{color:blue;border:1px solid black;font-size:12px;font-weight:500}`
    );
  });

  it('should transform template string with no argument function variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        function mixin() {
          return { color: 'red' };
        }

        <div css={\`\${mixin()}\`}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:red}');
  });

  xit('should transform template string with argument arrow function variable', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const mixin = (color: string) => ({ color, fontSize: '30px' });
        const primary = 'red';

        <div css={\`\${mixin(primary)}\`}>hello world</div>
      `);

    expect(actual).toInclude('.css-test{color:var(--var-test);font-size:30px}');
    expect(actual).toInclude('style={{ "--var-test": primary }}');
  });

  it('should inline multiple constant interpolations', () => {
    const actual = transform(`
        import React from 'react';
        import '@compiled/core';

        const x = 1;
        const y = '2px';

        <div
          css={\`
            transform: translate3d(\${x}px, $\{y}, 0);
            color: red;
          \`}
        >
          hello world
        </div>
      `);
    expect(actual).toInclude('.cc-hash-test{transform:translate3d(1px,2px,0);color:red');
  });

  it('should reference multiple interpolations in a group', () => {
    const actual = transform(`
        import React from 'react';
        import '@compiled/core';

        let x = 1;
        x = 1;
        let y = '2px';
        y = '2px';

        <div
          css={\`
            transform: translate3d(\${x}px, $\{y}, 0);
            color: red;
          \`}
        >
          hello world
        </div>
      `);

    // TODO: Correct the hash mock so variables have a unique name instead of hash-test.
    // expect(actual).toInclude('style={{"--var-hash-test":(x||"")+"px","--var-hash-test":y}}');
    expect(actual).toInclude('style={{"--var-hash-test":(x||"")+"px"}}');
    expect(actual).toInclude(
      '.cc-hash-test{transform:translate3d(var(--var-hash-test),var(--var-hash-test),0);color:red}'
    );
  });

  it('should transform function returning an object', () => {
    const actual = transform(`
        import '@compiled/core';
        import React from 'react';

        const color = 'red';
        const mixin = () => ({ color });

        <div css={\`color: \${mixin().color};\`}>hello world</div>
      `);

    expect(actual).toInclude('.cc-hash-test{color:red}');
  });
});
