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

describe('styled component string literal', () => {
  it('should respect missing units', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div\`
          font-size: 12;
        \`;
      `);

    expect(actual).toInclude('{font-size:12}');
  });

  it('should not pass down invalid html attributes to the node when property has a suffix', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div\`
          font-size: \${props => props.textSize}px;
        \`;
      `);

    expect(actual).toInclude('{font-size:var(--var-fb92co)}');
    expect(actual).toInclude('textSize,...props}');
    expect(actual).toInclude('"--var-fb92co":(textSize||"")+"px"');
  });

  it('should inline constant numeric literal', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const fontSize = 20;

        const ListItem = styled.div\`
          font-size: \${fontSize}px;
        \`;
      `);

    expect(actual).toInclude('{font-size:20px}');
  });

  it('should move suffix to inline styles when referencing a mutable numeric literal', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        let fontSize = 20;
        fontSize = 19;

        const ListItem = styled.div\`
          font-size: \${fontSize}px;
        \`;
      `);

    expect(actual).toInclude('"--var-1j2e0s2":(fontSize||"")+"px"');
    expect(actual).toInclude('{font-size:var(--var-1j2e0s2)}');
  });

  it('should move suffix to inline styles when referencing a mutable numeric literal when missing a semi colon', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        let fontSize = 20;
        fontSize = 19;

        const ListItem = styled.div\`
          font-size: \${fontSize}px
        \`;
      `);

    expect(actual).toInclude('"--var-1j2e0s2":(fontSize||"")+"px"');
    expect(actual).toInclude('{font-size:var(--var-1j2e0s2)}');
  });

  it('should transform a static template literal', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          font-size: 20px;
        \`;
      `);

    expect(actual).toInclude('{font-size:20px}');
  });

  it('should inline constant string literal', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const fontSize = '20px';

        const ListItem = styled.div\`
          font-size: \${fontSize};
        \`;
      `);

    expect(actual).toInclude('{font-size:20px}');
  });

  it('should transform template string literal with prop reference', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          color: \${props => props.color};
        \`;
      `);

    expect(actual).toInclude('{color:var(--var-1p69eoh)');
    expect(actual).toInclude('"--var-1p69eoh":props.color');
  });

  it('should transform an arrow function with a body into an IIFE', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          color: \${props => { return props.color; }};
        \`;
      `);

    expect(actual).toInclude('{color:var(--var-1poneq5)}');
    expect(actual).toInclude('"--var-1poneq5":(()=>{return props.color;})()}}');
  });

  it('should transform an arrow function with a body into an IIFE by preventing passing down invalid html attributes to the node', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          font-size: \${props => { return props.textSize; }};
        \`;
      `);

    expect(actual).toInclude('{font-size:var(--var-1j0t240)}');
    expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
    expect(actual).toInclude('"--var-1j0t240":(()=>{return textSize;})()}}');
  });

  it('should move suffix and prefix of a dynamic arrow function with a body into an IIFE', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          color: very$\{props => { return props.color; }}dark;
        \`;
      `);

    expect(actual).toInclude('{color:var(--var-1poneq5)}');
    expect(actual).toInclude('"--var-1poneq5":"very"+((()=>{return props.color;})()||"")+"dark"');
  });

  it('should move suffix and prefix of a dynamic arrow function with a body into an IIFE by preventing passing down invalid html attributes to the node', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          font-size: super$\{props => { return props.textSize; }}big;
        \`;
      `);

    expect(actual).toInclude('{font-size:var(--var-1j0t240)}');
    expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
    expect(actual).toInclude('"--var-1j0t240":"super"+((()=>{return textSize;})()||"")+"big"');
  });

  it('should transform template string literal with obj variable', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const h200 = { fontSize: '12px' };

        const ListItem = styled.div\`
          \${h200};
          color: blue;
        \`;
      `);

    expect(actual).toInclude('{font-size:12px}');
    expect(actual).toInclude('{color:blue}');
  });

  it('should reference identifier pointing to a call expression if it returns simple value', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const em = (str) => str;
        const color = em('blue');

        const ListItem = styled.div\`
          color: \${color};
        \`;
      `);

    expect(actual).toInclude('{color:var(--var-1ylxx6h)');
    expect(actual).toInclude('"--var-1ylxx6h":color');
  });

  it('should inline call if it returns simple value', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const em = (str) => str;

        const ListItem = styled.div\`
          color: \${em('blue')};
        \`;
      `);

    expect(actual).toInclude('{color:var(--var-16ywsic)}');
    expect(actual).toInclude(`"--var-16ywsic":em('blue')`);
  });

  it('should transform template string with no argument arrow function variable', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const mixin = () => ({ color: 'red' });

        const ListItem = styled.div\`
          \${mixin()};
        \`;
      `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform template string with no argument arrow function variable when not called', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const mixin = () => ({ color: 'red' });

        const ListItem = styled.div\`
          \${mixin};
        \`;
      `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform template string with no argument functions', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const color = () => 'blue';
        const fontStyling = {
          style: 'italic',
          family: 'sans-serif',
        };

        const mixin1 = function() { return fontStyling.style; };
        function mixin2() { return fontStyling.family; };

        const ListItem = styled.div\`
          color: blue;
          font-style: \${mixin1()};
          font-family: \${mixin2()};
          :hover { background-color: \${color()} };
        \`;
      `);

    expect(actual).toInclude(`{color:blue}`);
    expect(actual).toInclude(`{font-style:italic}`);
    expect(actual).toInclude(`{font-family:sans-serif}`);
    expect(actual).toInclude(':hover{background-color:blue}');
  });

  it('should transform template string with no argument function properties belonging to a variable', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const color = () => 'blue';
        const fontSize = 12;
        const fontStyling = {
          weight: 500
        };

        const sizes = {
          mixin1: () => '1px solid black',
          mixin2: () => fontSize,
          mixin3: function() {return fontStyling.weight;}
        };

        const ListItem = styled.div\`
          color: blue;
          border: \${sizes.mixin1()};
          font-size: \${sizes.mixin2()}px;
          font-weight: \${sizes.mixin3()};
          :hover { background-color: \${color()} };
        \`;
      `);

    expect(actual).toInclude(`{color:blue}`);
    expect(actual).toInclude(`{border:1px solid black}`);
    expect(actual).toInclude(`{font-size:12px}`);
    expect(actual).toInclude(`{font-weight:500}`);
    expect(actual).toInclude(':hover{background-color:blue}');
  });

  it('should move suffix and prefix of a dynamic arrow func property into the style property', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          font-size: super$\{props => props.color}big;
        \`;
      `);

    expect(actual).toInclude('"--var-1p69eoh":"super"+(props.color||"")+"big"');
  });

  it('should move any prefix of a dynamic arrow func property into the style property', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          font-size: super$\{props => props.color};
        \`;
      `);

    expect(actual).toInclude('"--var-1p69eoh":"super"+(props.color||"")');
  });

  it('should move any suffix of a dynamic arrow func property into the style property', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          font-size: $\{props => props.color}big;
        \`;
      `);

    expect(actual).toInclude('"--var-1p69eoh":(props.color||"")+"big"');
  });

  it('should move suffix and prefix of a dynamic property into the style property', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        let color = 'red';
        color = 'blue';

        const ListItem = styled.div\`
          font-size: super$\{color}big;
          color: red;
        \`;
      `);

    expect(actual).toInclude('{font-size:var(--var-1ylxx6h)}');
    expect(actual).toInclude('"--var-1ylxx6h":"super"+(color||"")+"big"');
  });

  it('should do nothing with suffix/prefix when referencing constant literal', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const color = 'red';
        const ListItem = styled.div\`
          font-size: super$\{color}big;
          color: red;
        \`;
      `);

    expect(actual).toInclude('{font-size:superredbig}');
  });

  it('should transform template string with no argument function variable', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        function mixin() {
          return { color: 'red' };
        }

        const ListItem = styled.div\`
          \${mixin()};
        \`;
      `);

    expect(actual).toInclude('{color:red}');
  });

  it('should only destructure a prop if hasnt been already', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div\`
          > :first-child {
            display: $\{(props) => (props.isShown ? 'none' : 'block')};
          }

          > :last-child {
            opacity: $\{(props) => (props.isShown ? 1 : 0)};
          }
        \`;
      `);

    // `isShown` should be destructured only once.
    expect(actual).toInclude('({as:C="div",style,isShown,...props},ref)');
  });

  it('should transform identifier referencing an expression with suffix', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        let br = 2 + 2;
        br += br;

        const Div = styled.div\`
          border-radius: \${br}px;
          color: red;
        \`;
      `);

    expect(actual).toInclude('{border-radius:var(--var-1hwymmh)}');
    expect(actual).toInclude('"--var-1hwymmh":(br||"")+"px"');
  });

  it('should transform inline arrow function with suffix', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const getBr = () => 4;
        const Div = styled.div\`
          border-radius: \${getBr}px;
          color: red;
        \`;
      `);

    expect(actual).toInclude('{border-radius:4px}');
    expect(actual).toInclude('{color:red}');
  });

  it('should transform arrow function call that returns css like object', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const getBr = () => ({ fontSize: 12 });
        const Div = styled.div\`
          \${getBr()};
          color: red;
        \`;
      `);

    expect(actual).toInclude('{font-size:12px}');
    expect(actual).toInclude('{color:red}');
  });

  it('should transform arrow function call that returns number', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const getBr = () => 12;
        const Div = styled.div\`
          font-size: \${getBr()}px;
          color: red;
        \`;
      `);

    expect(actual).toInclude('{font-size:12px}');
    expect(actual).toInclude('{color:red}');
  });

  it('should transform arrow function call that has a complex body', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const getBr = () => {
          return true ? '1' : '2';
        };
        const Div = styled.div\`
          font-size: \${getBr()}px;
          color: red;
        \`;
      `);

    expect(actual).toInclude('{color:red}');
    expect(actual).toInclude('{font-size:1px}');
  });

  it('should transform function returning an object', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        import React from 'react';

        const color = 'red';
        const mixin = () => ({ color });

        const ListItem = styled.div\`
          color: \${mixin().color};
        \`;
      `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform member expression referencing a function which returns an object', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        import React from 'react';

        const color = 'red';
        const mixin = () => ({ color });

        const colors = mixin();

        const ListItem = styled.div\`
          color: \${colors.color};
        \`;
      `);

    expect(actual).toInclude('{color:red}');
  });
});
