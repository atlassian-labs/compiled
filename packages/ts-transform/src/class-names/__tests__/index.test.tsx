import * as ts from 'typescript';
import { Transformer } from 'ts-transformer-testing-library';
import classNamesTransformer from '../index';

jest.mock('../../utils/hash');

const transformer = new Transformer()
  .addTransformer(classNamesTransformer)
  .addMock({ name: '@compiled/css-in-js', content: `export const ClassNames: any = () => null` })
  .addMock({
    name: 'react',
    content: `export default {} as any; export const useState = {} as any;`,
  })
  .setFilePath('/index.tsx');

describe('class names transformer', () => {
  it('should replace class names component style element', () => {
    const actual = transformer.transform(`
      import { ClassNames } from '@compiled/css-in-js';

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

  it('should remove class names import', () => {
    const actual = transformer.transform(`
      import { ClassNames } from '@compiled/css-in-js';

      const ListItem = () => (
        <ClassNames>
          {({ css }) => <div className={css({ fontSize: '20px' })}>hello, world!</div>}
        </ClassNames>
      );
    `);

    expect(actual).not.toInclude(`import { ClassNames } from "@compiled/css-in-js";`);
  });

  it('should add an identifier nonce to the style element', () => {
    const stubProgam: ts.Program = ({
      getTypeChecker: () => ({
        getSymbolAtLocation: () => undefined,
      }),
    } as never) as ts.Program;
    const transformer = classNamesTransformer(stubProgam, { nonce: '__webpack_nonce__' });

    const actual = ts.transpileModule(
      `
        import { ClassNames } from '@compiled/css-in-js';

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

  it('should set children as function into a jsx expression', () => {
    const actual = transformer.transform(`
    import { ClassNames } from '@compiled/css-in-js';

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

  it('should place self closing jsx element as a child', () => {
    const actual = transformer.transform(`
    import { ClassNames } from '@compiled/css-in-js';

    const ZoomOnHover = ({ children }) => (
      <ClassNames>
        {({ css }) => <div className={css({ fontSize: 12 })} />}
      </ClassNames>
    );
  `);

    expect(actual).toInclude(`</CS><div className={\"css-test\"}/></CC>`);
  });

  describe('using a string literal', () => {
    it('should move suffix of interpolation into inline styles', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

        const fontSize = 20;

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css\`font-size: \${fontSize}px;\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    it('should transform no template string literal', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`font-size: 20px\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test{font-size:20px}');
    });

    it('should transform template string literal with string variable', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

        const fontSize = '12px';

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`font-size: \${fontSize};\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`.css-test{font-size:12px}`);
    });

    it('should transform template string literal with numeric variable', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

        const fontSize = 12;

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`font-size: \${fontSize};\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`.css-test{font-size:12}`);
    });

    it('should transform template string literal with string import', () => {
      const actual = transformer.addSource({
        path: '/constants.ts',
        contents: "export const fontSize = '12px';",
      }).transform(`
        import { ClassNames } from '@compiled/css-in-js';
        import { fontSize } from './constants';

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`font-size: \${fontSize};\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`.css-test{font-size:12px}`);
      expect(actual).toInclude(`<div className={\"css-test\"}>hello, world!</div>`);
    });

    it('should transform template string literal with obj variable', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

        const color = { color: 'blue' };

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
    });

    it('should transform template string literal with obj import', () => {
      const actual = transformer.addSource({
        path: '/mix.ts',
        contents: `export const color = { color: 'blue' };`,
      }).transform(`
        import { ClassNames } from '@compiled/css-in-js';
        import { color } from './mix';

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

    it('should transform template string with no argument arrow function variable', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

        const color = () => ({ color: 'blue' });

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color()}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
    });

    it('should transform template string with no argument arrow function import', () => {
      const actual = transformer.addSource({
        path: '/mixin.ts',
        contents: `export const color = () => ({ color: 'blue' });`,
      }).transform(`
        import { ClassNames } from '@compiled/css-in-js';
        import { color } from './mixin';

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color()}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
    });

    it('should transform template string with no argument function variable', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

        function color() { return { color: 'blue' }; }

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color()}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
    });

    it('should transform template string with no argument function import', () => {
      const actual = transformer.addSource({
        path: '/mixin.ts',
        contents: `
          export function color() { return { color: 'blue' }; }
        `,
      }).transform(`
        import { ClassNames } from '@compiled/css-in-js';
        import { color } from './mixin';

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color()}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`.css-test{color:blue}`);
    });

    it.todo('should transform template string with argument function variable');

    it.todo('should transform template string with argument function import');

    it.todo('should transform template string with argument arrow function variable');

    it.todo('should transform template string with argument arrow function import');
  });

  describe('using an object literal', () => {
    it('should persist suffix of dynamic property value into inline styles', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';
        import {useState} from 'react';

        const fontSize = useState(20);

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ fontSize: \`\${fontSize}px\` })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(
        '<div style={{ "--var-test-fontsize": fontSize + "px" }} className={"css-test"}>hello, world!</div>'
      );
      expect(actual).toInclude('.css-test{font-size:var(--var-test-fontsize)}');
    });

    it('should transform object with simple values', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ color: 'red', margin: 0 })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test{color:red;margin:0}');
    });

    it('should transform object with nested object into a selector', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ ':hover': { color: 'red', margin: 0 } })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test:hover{color:red;margin:0}');
    });

    it('should transform object that has a variable reference', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

        const color = 'red';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ color, margin: 0 })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test{color:red;margin:0}');
    });

    it('should transform object spread from variable', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

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

    it('should transform object spread from import', () => {
      const actual = transformer.addSource({
        path: '/mixy.ts',
        contents: "export const mixin = { color: 'red' };",
      }).transform(`
        import { ClassNames } from '@compiled/css-in-js';
        import { mixin } from './mixy';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ color: 'blue', ...mixin })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test{color:blue;color:red}');
    });

    it('should transform object with string variable', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';
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

    it('should transform object with string import', () => {
      const actual = transformer.addSource({
        path: '/mixy.ts',
        contents: "export const color = 'red';",
      }).transform(`
        import { ClassNames } from '@compiled/css-in-js';
        import { color } from './mixy';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ color })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.css-test{color:red}');
    });

    it('should transform object with obj variable', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

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

    it('should transform object with obj import', () => {
      const actual = transformer.addSource({
        contents: `export const hover = { color: 'red' };`,
        path: './mixins.tsx',
      }).transform(`
        import { ClassNames } from '@compiled/css-in-js';
        import { hover } from './mixins';

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

    it.todo('should transform object with array import');

    it.todo('should transform object with no argument arrow function variable');

    it.todo('should transform object with no argument arrow function import');

    it.todo('should transform object with no argument function variable');

    it.todo('should transform object with no argument function import');

    it.todo('should transform object with argument function variable');

    it.todo('should transform object with argument function import');

    it.todo('should transform object with argument arrow function variable');

    it.todo('should transform object with argument arrow function import');
  });
});
