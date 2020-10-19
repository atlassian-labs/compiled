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

describe('styled component object literal', () => {
  it('should respect the definition of pseudo element content ala emotion with double quotes', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          ':after': {
            content: '""',
          },
        });
      `);

    expect(actual).toInclude(':after{content:\\"\\"}');
  });

  it('should respect the definition of pseudo element content ala emotion with single quotes', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          ':after': {
            content: "''",
          },
        });
      `);

    expect(actual).toInclude(":after{content:''}");
  });

  it('should respect the definition of pseudo element content ala styled components with no content', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          ':after': {
            content: '',
          },
        });
      `);

    expect(actual).toInclude(':after{content:\\"\\"}');
  });

  it('should respect the definition of pseudo element content ala styled components with content', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          ':after': {
            content: '😎',
          },
        });
      `);

    expect(actual).toInclude(':after{content:\\"\\uD83D\\uDE0E\\"}');
  });

  it('should append "px" on numeric literals if missing', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          fontSize: 12,
        });
      `);

    expect(actual).toInclude('{font-size:12px}');
  });

  it('should reference property access expression', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        let color = { blue: 'red' };
        color = {};

        styled.div({
          background: color.blue,
        });
      `);

    expect(actual).toInclude('{background:var(--var-1mkyvve)}');
    expect(actual).toInclude('"--var-1mkyvve":color.blue');
  });

  it('should not pass down invalid html attributes to the node when property has a suffix', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          fontSize: props => \`\${props.textSize}px\`,
        });
      `);

    expect(actual).toInclude('{font-size:var(--var-7wpnv5)}');
    expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
    expect(actual).toInclude('"--var-7wpnv5":`${textSize}px`');
  });

  it('should not pass down invalid html attributes to the node when property has a suffix when func in template literal', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          fontSize: \`\${props => props.textSize}px\`,
        });
      `);

    expect(actual).toInclude('{font-size:var(--var-fb92co)}');
    expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
    expect(actual).toInclude('"--var-fb92co":(textSize||"")+"px"');
  });

  it('should transform object with simple values', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div({
          color: 'blue',
          marginLeft: 0,
        });
      `);

    expect(actual).toInclude('{color:blue}');
    expect(actual).toInclude('{margin-left:0}');
  });

  it('should transform object with nested object into a selector', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div({
          ':hover': {
            color: 'blue',
            marginLeft: 0,
          },
        });
      `);

    expect(actual).toInclude(':hover{color:blue}');
    expect(actual).toInclude(':hover{margin-left:0}');
  });

  it('should reference identifier pointing to a call expression if it returns simple value', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const em = (str) => str;
        const color = em('blue');

        const ListItem = styled.div({
          color,
        });
      `);

    expect(actual).toInclude('{color:var(--var-1ylxx6h)}');
    expect(actual).toInclude('"--var-1ylxx6h":color');
  });

  it('should inline call if it returns simple value', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const em = (str) => str;

        const ListItem = styled.div({
          color: em('blue'),
        });
      `);

    expect(actual).toInclude('{color:var(--var-16ywsic)}');
    expect(actual).toInclude('"--var-16ywsic":em(\'blue\')');
  });

  it('should inline constant string literal', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const color = 'blue';

        const ListItem = styled.div({
          color,
        });
      `);

    expect(actual).toInclude('{color:blue}');
  });

  it('should transform template object with prop reference', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div({
          color: props => props.color,
        });
      `);

    expect(actual).toInclude('{color:var(--var-1p69eoh)}');
    expect(actual).toInclude('"--var-1p69eoh":props.color');
  });

  it('should transform object spread from variable', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const h100 = { fontSize: '12px' };

        const ListItem = styled.div({
          ...h100,
          color: 'red',
        });
      `);

    expect(actual).toInclude('{font-size:12px}');
    expect(actual).toInclude('{color:red}');
  });

  it('should transform object with mutable identifier', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        let color = 'blue';
        color = 'red';

        const ListItem = styled.div({
          color: color,
        });
      `);

    expect(actual).toInclude('{color:var(--var-1ylxx6h)}');
    expect(actual).toInclude('"--var-1ylxx6h":color');
  });

  it('should transform object with obj variable', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const hover = { color: 'red' };

        const ListItem = styled.div({
          fontSize: '20px',
          ':hover': hover,
        });
      `);

    expect(actual).toInclude('{font-size:20px}');
    expect(actual).toInclude(':hover{color:red}');
  });

  it('should transform object with no argument arrow function variable', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const mixin = () => ({ color: 'red' });

        const ListItem = styled.div({
          ...mixin(),
        });
      `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform object with no argument function variable', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        function mixin() {
          return { color: 'red' };
        }

        const ListItem = styled.div({
          ...mixin(),
        });
      `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform object with no argument functions', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const bgColor = 'blue';
        const fontStyling = {
          style: 'italic',
          family: 'sans-serif',
        };

        const mixin1 = () => ({ color: 'red', backgroundColor: bgColor });
        const mixin2 = function() { return { fontStyle: fontStyling.style } };
        function mixin3() { return { fontFamily: fontStyling.family } };

        const ListItem = styled.div({
          color: 'blue',
          ':hover': mixin1(),
          ...mixin2(),
          ...mixin3(),
        });
      `);

    expect(actual).toInclude(`{color:blue}`);
    expect(actual).toInclude(`{font-style:italic}`);
    expect(actual).toInclude(`{font-family:sans-serif}`);
    expect(actual).toInclude(':hover{color:red}');
    expect(actual).toInclude(':hover{background-color:blue}');
  });

  it('should transform object with no argument function properties belonging to a variable', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const bgColor = 'blue';
        const fontSize = 12;
        const fontStyling = {
          weight: 500
        };

        const sizes = {
          mixin1: () => \`1px solid \${bgColor}\`,
          mixin2: () => ({ fontSize }),
          mixin3: function() {return {fontWeight: fontStyling.weight};}
        };

        const ListItem = styled.div({
          color: 'blue',
          border: sizes.mixin1(),
          ...sizes.mixin2(),
          ...sizes.mixin3()
        });
      `);

    expect(actual).toInclude(`{color:blue}`);
    expect(actual).toInclude(`{border:1px blue solid}`);
    expect(actual).toInclude(`{font-size:12px}`);
    expect(actual).toInclude(`{font-weight:500}`);
  });

  it('should transform function returning an object', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        import React from 'react';

        const color = 'red';
        const mixin = () => ({ color });

        const ListItem = styled.div({
          color: mixin().color,
        });
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

        const ListItem = styled.div({
          color: colors.color,
        });
      `);

    expect(actual).toInclude('{color:red}');
  });
});
