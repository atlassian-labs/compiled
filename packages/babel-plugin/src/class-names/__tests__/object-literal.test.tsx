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

describe('class names object literal', () => {
  xit('should persist suffix of dynamic property value into inline styles', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';
        import {useState} from 'react';

        const fontSize = useState(20);

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ fontSize: \`\${fontSize}px\` })}>hello, world!</div>}
          </ClassNames>
        );
      `);

    expect(actual).toInclude(
      '<div style={{ "--_test-fontsize": (fontSize || "") + "px" }} className={"css-test"}>hello, world!</div>'
    );
    expect(actual).toInclude('.css-test{font-size:var(--_test-fontsize)}');
  });

  xit('should transform object with simple values', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

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
        import { ClassNames } from '@compiled/react';

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
        import { ClassNames } from '@compiled/react';

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
        import { ClassNames } from '@compiled/react';

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
        import { ClassNames } from '@compiled/react';
        import {useState} from 'react';
        const color = 'blue';
        const [fontSize] = useState('10px');

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ color, fontSize })}>hello, world!</div>}
          </ClassNames>
        );
      `);

    expect(actual).toInclude('.css-test{color:blue;font-size:var(--_test-fontsize)}');
    expect(actual).toInclude(
      '<div style={{ "--_test-fontsize": fontSize }} className={"css-test"}>hello, world!</div>'
    );
  });

  xit('should transform object with obj variable', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

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
