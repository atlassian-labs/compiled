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

describe('class names transformer', () => {
  it('should replace destructured call expressions', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/core';

      const ListItem = () => (
        <ClassNames>
          {({ css }) => (<div className={css({ fontSize: '20px' })}>hello, world!</div>)}
        </ClassNames>
      );
    `);

    expect(actual).toInclude(
      'const ListItem = () => (<CC><CS hash="css-test">{[".css-test{font-size:20px}"]}</CS><div className={"css-test"}>hello, world!</div></CC>)'
    );
  });

  xit('should replace class expressions', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/core';

      const ListItem = () => (
        <ClassNames>
          {(props) => (<div className={props.css({ fontSize: '20px' })}>hello, world!</div>)}
        </ClassNames>
      );
    `);

    expect(actual).toInclude(
      'const ListItem = () => (<CC><CS hash="css-test">{[".css-test{font-size:20px}"]}</CS><div className={"css-test"}>hello, world!</div></CC>)'
    );
  });

  xit('should remove class names import', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/core';

      const ListItem = () => (
        <ClassNames>
          {({ css }) => <div className={css({ fontSize: '20px' })}>hello, world!</div>}
        </ClassNames>
      );
    `);

    expect(actual).not.toInclude(`import { ClassNames } from "@compiled/core";`);
  });

  xit('should add an identifier nonce to the style element', () => {
    const actual = transform(
      `
        import { ClassNames } from '@compiled/core';

        const ZoomOnHover = ({ children }) => (
          <ClassNames>
            {({ css }) =>
              children({
                className: css({
                  transition: 'transform 2000ms',
                  ':hover': {
                    transform: 'scale(2)',
                  },
                }),
              })
            }
          </ClassNames>
        );
      `
    );

    expect(actual).toInclude('<CS hash="css-test" nonce={__webpack_nonce__}>');
  });

  xit('should set children as function into a jsx expression', () => {
    const actual = transform(`
    import { ClassNames } from '@compiled/core';

    const ZoomOnHover = ({ children }) => (
      <ClassNames>
        {({ css }) =>
          children({
            className: css({
              transition: 'transform 2000ms',
              ':hover': {
                transform: 'scale(2)',
              },
            }),
          })
        }
      </ClassNames>
    );
  `);

    expect(actual).toInclude(`{children({
    className: "css-test",
})}`);
  });

  xit('should place self closing jsx element as a child', () => {
    const actual = transform(`
    import { ClassNames } from '@compiled/core';

    const ZoomOnHover = ({ children }) => (
      <ClassNames>
        {({ css }) => <div className={css({ fontSize: 12 })} />}
      </ClassNames>
    );
  `);

    expect(actual).toInclude(`</CS><div className={\"css-test\"}/></CC>`);
  });

  describe('using a string literal', () => {
    xit('should move suffix of interpolation into inline styles', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';

        const fontSize = 20;

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css\`font-size: \${fontSize}px;\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    xit('should transform no template string literal', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`font-size: 20px\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    xit('should transform template string literal with string variable', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';

        const fontSize = '12px';

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`font-size: \${fontSize};\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`.css-test{font-size:12px}`);
    });

    xit('should transform template string literal with numeric variable', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';

        const fontSize = 12;

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`font-size: \${fontSize};\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`.css-test{font-size:12}`);
    });

    xit('should transform template string literal with obj variable', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';

        const color = { color: 'blue' };

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
    });

    it.todo('should transform template string literal with array variable');

    it.todo('should transform template string literal with array import');

    xit('should transform template string with no argument arrow function variable', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';

        const color = () => ({ color: 'blue' });

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color()}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
    });

    xit('should transform template string with no argument function variable', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';

        function color() { return { color: 'blue' }; }

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color()}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
    });

    it.todo('should transform template string with argument function variable');

    it.todo('should transform template string with argument arrow function variable');
  });

  describe('using an object literal', () => {
    xit('should persist suffix of dynamic property value into inline styles', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';
        import {useState} from 'react';

        const fontSize = useState(20);

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ fontSize: \`\${fontSize}px\` })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(
        '<div style={{ "--var-test-fontsize": (fontSize || "") + "px" }} className={"css-test"}>hello, world!</div>'
      );
      expect(actual).toInclude('.css-test{font-size:var(--var-test-fontsize)}');
    });

    xit('should transform object with simple values', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ color: 'red', margin: 0 })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test{color:red;margin:0}');
    });

    xit('should transform object with nested object into a selector', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ ':hover': { color: 'red', margin: 0 } })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test:hover{color:red;margin:0}');
    });

    xit('should transform object that has a variable reference', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';

        const color = 'red';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ color, margin: 0 })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test{color:red;margin:0}');
    });

    xit('should transform object spread from variable', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';

        const mixin = {
          color: 'red',
        };

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ color: 'blue', ...mixin })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test{color:blue;color:red}');
    });

    xit('should transform object with string variable', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';
        import {useState} from 'react';
        const color = 'blue';
        const [fontSize] = useState('10px');

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ color, fontSize })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test{color:blue;font-size:var(--var-test-fontsize)}');
      expect(actual).toInclude(
        '<div style={{ "--var-test-fontsize": fontSize }} className={"css-test"}>hello, world!</div>'
      );
    });

    xit('should transform object with obj variable', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/core';

        const hover = { color: 'red' };

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css({ fontSize: '20px', ':hover': hover })}>hello, world!</div>}
          </ClassNames>
        );
      `);
      expect(actual).toInclude('.css-test{font-size:20px}');
      expect(actual).toInclude('.css-test:hover{color:red}');
    });

    it.todo('should transform object with array variable');

    it.todo('should transform object with no argument arrow function variable');

    it.todo('should transform object with no argument function variable');

    it.todo('should transform object with argument function variable');

    it.todo('should transform object with argument arrow function variable');
  });
});
