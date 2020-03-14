import { Transformer } from 'ts-transformer-testing-library';
import classNamesTransformer from '../index';

jest.mock('../../utils/identifiers');

const transformer = new Transformer()
  .addTransformer(classNamesTransformer)
  .addMock({ name: '@compiled/css-in-js', content: `export const ClassNames: any = () => null` })
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
      'const ListItem = () => (<><Style hash="test-class">.test-class{font-size:20px;}</Style><div className={"test-class"}>hello, world!</div></>);'
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

  describe('using a string literal', () => {
    it('should persist suffix of dynamic property value into inline styles', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

        const fontSize = 20;

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css\`font-size \${fontSize}px;\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('style={{ "--fontSize-test-css-variable": fontSize + "px" }}');
      expect(actual).toInclude('.test-class{font-size:var(--fontSize-test-css-variable);}');
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

      expect(actual).toInclude('.test-class{font-size:20px;}');
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

      expect(actual).toInclude(`.test-class{font-size:var(--fontSize-test-css-variable);}`);
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

      expect(actual).toInclude(`.test-class{font-size:var(--fontSize-test-css-variable);}`);
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

      expect(actual).toInclude(`.test-class{font-size:var(--fontSize-test-css-variable);}`);
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

      expect(actual).toInclude(`.test-class{color:blue;}`);
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

      expect(actual).toInclude(`.test-class{color:blue;}`);
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

      expect(actual).toInclude(`.test-class{color:blue;}`);
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

      expect(actual).toInclude(`.test-class{color:blue;}`);
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

      expect(actual).toInclude(`.test-class{color:blue;}`);
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

      expect(actual).toInclude(`.test-class{color:blue;}`);
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

        const fontSize = 20;

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ fontSize: \`\${fontSize}px\` })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('style={{ "--fontSize-test-css-variable": fontSize + "px" }}');
      expect(actual).toInclude('.test-class{font-size:var(--fontSize-test-css-variable);}');
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

      expect(actual).toInclude('.test-class{color:red;margin:0;}');
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

      expect(actual).toInclude('.test-class:hover{color:red;margin:0;}');
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

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);margin:0;}');
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

      expect(actual).toInclude('.test-class{color:blue;color:red;}');
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

      expect(actual).toInclude('.test-class{color:blue;color:red;}');
    });

    it('should transform object with string variable', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '@compiled/css-in-js';

        const color = 'blue';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ color })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
      expect(actual).toInclude(
        '<div style={{ "--color-test-css-variable": color }} className={"test-class"}>hello, world!</div>'
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

      expect(actual).toInclude('.test-class{color:var(--color-test-css-variable);}');
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

      expect(actual).toInclude('.test-class{font-size:20px;}.test-class:hover{color:red;}');
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

      expect(actual).toInclude('.test-class{font-size:20px;}.test-class:hover{color:red;}');
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
