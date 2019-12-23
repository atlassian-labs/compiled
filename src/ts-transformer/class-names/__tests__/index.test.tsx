import { Transformer } from 'ts-transformer-testing-library';
import pkg from '../../../../package.json';
import classNamesTransformer from '../index';

jest.mock('../../utils/identifiers');

const transformer = new Transformer()
  .addTransformer(classNamesTransformer)
  .addMock({ name: pkg.name, content: `export const ClassNames: any = () => null` })
  .setFilePath('/index.tsx');

describe('class names transformer', () => {
  it('should replace class names component style element', () => {
    const actual = transformer.transform(`
      import { ClassNames } from '${pkg.name}';

      const ListItem = () => (
        <ClassNames>
          {({ css }) => (<div className={css({ fontSize: '20px' })}>hello, world!</div>)}
        </ClassNames>
      );
    `);

    expect(actual).toInclude(
      'const ListItem = () => (<><style>.test-class{font-size:20px;}</style><div className={"test-class"}>hello, world!</div></>);'
    );
  });

  it('should remove class names import', () => {
    const actual = transformer.transform(`
      import { ClassNames } from '${pkg.name}';

      const ListItem = () => (
        <ClassNames>
          {({ css }) => <div className={css({ fontSize: '20px' })}>hello, world!</div>}
        </ClassNames>
      );
    `);

    expect(actual).not.toInclude(`import { ClassNames } from "${pkg.name}";`);
  });

  it.todo('should add react default import if missing');

  it.todo('should add react default import if it only has named imports');

  it.todo('should do nothing if react default import is already defined');

  describe('using a string literal', () => {
    it.todo('should transform no template string literal');

    it.todo('should transform template string literal with string variable');

    it.todo('should transform template string literal with string import');

    it.todo('should transform template string literal with obj variable');

    it.todo('should transform template string literal with obj import');

    it.todo('should transform template string literal with array variable');

    it.todo('should transform template string literal with array import');

    it.todo('should transform template string with no argument arrow function variable');

    it.todo('should transform template string with no argument arrow function import');

    it.todo('should transform template string with no argument function variable');

    it.todo('should transform template string with no argument function import');

    it.todo('should transform template string with argument function variable');

    it.todo('should transform template string with argument function import');

    it.todo('should transform template string with argument arrow function variable');

    it.todo('should transform template string with argument arrow function import');
  });

  describe('using an object literal', () => {
    it.todo('should transform object with simple values');

    it.todo('should transform object with nested object into a selector');

    it.todo('should transform object with object selector from variable');

    it.todo('should transform object with object selector from import');

    it.todo('should transform object that has a variable reference');

    it.todo('should transform object spread from variable');

    it.todo('should transform object spread from import');

    it('should transform object with string variable', () => {
      const actual = transformer.transform(`
        import { ClassNames } from '${pkg.name}';

        const color = 'blue';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ color })}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude('<style>.test-class{color:var(--color-test-css-variable);}</style>');
      expect(actual).toInclude(
        '<div style={{ "--color-test-css-variable": color }} className={"test-class"}>hello, world!</div>'
      );
    });

    it.todo('should transform object with string import');

    it.todo('should transform object with obj variable');

    it.todo('should transform object with obj import');

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
