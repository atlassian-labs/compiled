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
});
