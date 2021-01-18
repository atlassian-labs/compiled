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
  it('should persist suffix of dynamic property value into inline styles', () => {
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

    expect(actual).toIncludeMultiple([
      'style={{"--_1j2e0s2":ix(fontSize,"px")}}',
      'font-size:var(--_1j2e0s2)',
    ]);
  });

  it('should transform object with simple values', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ color: 'red', marginTop: 0 })}>hello, world!</div>}
          </ClassNames>
        );
      `);

    expect(actual).toIncludeMultiple(['{color:red}', '{margin-top:0}']);
  });

  it('should transform object with nested object into a selector', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ ':hover': { color: 'red', marginTop: 0 } })}>hello, world!</div>}
          </ClassNames>
        );
      `);

    expect(actual).toIncludeMultiple([':hover{color:red}', ':hover{margin-top:0}']);
  });

  it('should transform object that has a variable reference', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const color = 'red';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ color, margin: 0 })}>hello, world!</div>}
          </ClassNames>
        );
      `);

    expect(actual).toIncludeMultiple(['{color:red}', '{margin-top:0}']);
  });

  it('should transform object spread from variable', () => {
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

    expect(actual).toIncludeMultiple(['{color:red}']);
  });

  it('should transform object with string variable', () => {
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

    expect(actual).toIncludeMultiple([
      'style={{"--_1j2e0s2":ix(fontSize)}}',
      'font-size:var(--_1j2e0s2)',
    ]);
  });

  it('should transform object with obj variable', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const hover = { color: 'red' };

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css({ fontSize: '20px', ':hover': hover })}>hello, world!</div>}
          </ClassNames>
        );
      `);

    expect(actual).toIncludeMultiple([':hover{color:red}', '{font-size:20px}']);
  });

  it('should transform object with argument arrow function variable', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const color1 = 'black';
        const mixin = ({ color1, color2: c }, color3, radius) => ({
          color: color1,
          backgroundColor: c,
          borderColor: color3 ,
          borderRadius: radius,
        });

        const color = { red: 'red' };
        const greenColor = 'green';

        const Component = (props) => {
          const color2 = 'black';

          return (
            <ClassNames>
              {({ css }) => <div className={css({ ...mixin({ color1: color.red, color2: 'blue' }, greenColor, 10) })} />}
            </ClassNames>
          );
        };
    `);

    expect(actual).toIncludeMultiple([
      '{color:red}',
      '{background-color:blue}',
      '{border-color:green}',
      '{border-radius:10px}',
    ]);
  });

  it('should transform object with unresolved argument arrow function variable', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const radius = 10;
        const mixin = (color1, radius, size, weight) => ({
          color: color1,
          borderRadius: radius,
          fontSize: size,
          fontWeight: weight
        });

        const Component = (props) => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ ...mixin(props.color1, radius) })} />}
          </ClassNames>
        );
      `);

    expect(actual).toIncludeMultiple([
      '{color:var(--_zo7lop)}',
      '"--_zo7lop":ix(props.color1)',
      '{border-radius:10px}',
      '{font-weight:var(--_u6vle4)}',
      '"--_u6vle4":ix()',
      '{font-size:var(--_kre2x8)}',
      '"--_kre2x8":ix()',
    ]);
  });

  it('should transform object with argument arrow function variable inside member expression', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const mixin = {
          value: (color1, r, color2) => ({
            color: color1,
            borderRadius: r,
            borderColor: color2,
          })
        }

        const radius = 10;

        const Component = (props) => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css({ ...mixin.value(props.color1, radius, 'red') })} />}
          </ClassNames>
        );
      `);

    expect(actual).toIncludeMultiple([
      '"--_zo7lop":ix(props.color1)',
      '{border-radius:10px}',
      '{border-color:red}',
    ]);
  });
});
