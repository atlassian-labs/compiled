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

describe('class names string literal', () => {
  xit('should move suffix of interpolation into inline styles', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

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
        import { ClassNames } from '@compiled/react';

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
        import { ClassNames } from '@compiled/react';

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
        import { ClassNames } from '@compiled/react';

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
        import { ClassNames } from '@compiled/react';

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
        import { ClassNames } from '@compiled/react';

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
        import { ClassNames } from '@compiled/react';

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
