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

    expect(actual).toInclude('.cc-hash-test:after{content:\\"\\"}');
  });

  xit('should add quotations to dynamically set content', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          ':after': {
            content: props => props.content,
          },
        });
      `);

    expect(actual).toInclude(`"--var-hash-test":'"'+props.content+'"'`);
    expect(actual).toInclude('.cc-hash-test:after{content:var(--var-hash-test)}');
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

    expect(actual).toInclude(".cc-hash-test:after{content:''}");
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

    expect(actual).toInclude('.cc-hash-test:after{content:\\"\\"}');
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

    expect(actual).toInclude('.cc-hash-test:after{content:\\"\\uD83D\\uDE0E\\"}');
  });

  it('should append "px" on numeric literals if missing', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          fontSize: 12,
        });
      `);

    expect(actual).toInclude('.cc-hash-test{font-size:12px}');
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

    expect(actual).toInclude('.cc-hash-test{background:var(--var-hash-test)}');
    expect(actual).toInclude('"--var-hash-test":color.blue');
  });

  it('should not pass down invalid html attributes to the node when property has a suffix', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          fontSize: props => \`\${props.textSize}px\`,
        });
      `);

    expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
    expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
    expect(actual).toInclude('"--var-hash-test":`${textSize}px`');
  });

  it('should not pass down invalid html attributes to the node when property has a suffix when func in template literal', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';
        const ListItem = styled.div({
          fontSize: \`\${props => props.textSize}px\`,
        });
      `);

    expect(actual).toInclude('.cc-hash-test{font-size:var(--var-hash-test)}');
    expect(actual).toInclude('({as:C="div",style,textSize,...props},ref)');
    expect(actual).toInclude('"--var-hash-test":(textSize||"")+"px"');
  });

  it('should transform object with simple values', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div({
          color: 'blue',
          margin: 0,
        });
      `);

    expect(actual).toInclude('.cc-hash-test{color:blue;margin:0}');
  });

  it('should transform object with nested object into a selector', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div({
          ':hover': {
            color: 'blue',
            margin: 0,
          },
        });
      `);

    expect(actual).toInclude('.cc-hash-test:hover{color:blue;margin:0}');
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

    expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
    expect(actual).toInclude('"--var-hash-test":color');
  });

  it('should inline call if it returns simple value', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const em = (str) => str;

        const ListItem = styled.div({
          color: em('blue'),
        });
      `);

    expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
    expect(actual).toInclude('"--var-hash-test":em(\'blue\')');
  });

  it('should inline constant string literal', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const color = 'blue';

        const ListItem = styled.div({
          color,
        });
      `);

    expect(actual).toInclude('.cc-hash-test{color:blue}');
  });

  it('should transform template object with prop reference', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const ListItem = styled.div({
          color: props => props.color,
        });
      `);

    expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
    expect(actual).toInclude('"--var-hash-test":props.color');
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

    expect(actual).toInclude('.cc-hash-test{font-size:12px;color:red}');
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

    expect(actual).toInclude('.cc-hash-test{color:var(--var-hash-test)}');
    expect(actual).toInclude('"--var-hash-test":color');
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

    expect(actual).toInclude('.cc-hash-test{font-size:20px}');
    expect(actual).toInclude('.cc-hash-test:hover{color:red}');
  });

  it.todo('should transform object with array variable');

  it('should transform object with no argument arrow function variable', () => {
    const actual = transform(`
        import { styled } from '@compiled/core';

        const mixin = () => ({ color: 'red' });

        const ListItem = styled.div({
          ...mixin(),
        });
      `);

    expect(actual).toInclude('.cc-hash-test{color:red}');
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

    expect(actual).toInclude('.cc-hash-test{color:red}');
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

    expect(actual).toInclude(`.cc-hash-test{color:blue;font-style:italic;font-family:sans-serif}`);
    expect(actual).toInclude('.cc-hash-test:hover{color:red;background-color:blue}');
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

    expect(actual).toInclude(
      `.cc-hash-test{color:blue;border:1px solid blue;font-size:12px;font-weight:500}`
    );
  });

  it.todo('should transform object with argument function variable');

  it.todo('should transform object with argument arrow function variable');
});
