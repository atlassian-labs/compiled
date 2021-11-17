import { transform } from '../../test-utils';

describe('ClassNames used with a css call expression', () => {
  describe('transforms an object expression that contains', () => {
    it('inlined values', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => (
              <div
                className={css({ color: 'red', marginTop: 0 })}
                style={style}
              >
                hello, world!
              </div>
            )}
          </ClassNames>
        );
      `);

      expect(actual).toIncludeMultiple(['{color:red}', '{margin-top:0}']);
    });

    it('an inlined psuedo-class object expression', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => (
              <div
                className={css({ ':hover': { color: 'red', marginTop: 0 } })}
                style={style}
              >
                hello, world!
              </div>
            )}
          </ClassNames>
        );
      `);

      expect(actual).toIncludeMultiple([':hover{color:red}', ':hover{margin-top:0}']);
    });

    it('a declared psuedo-class object expression', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const hover = { color: 'red' };

        const ListItem = () => (
          <ClassNames>
            {({ css }) => (
              <div className={css({ fontSize: '20px', ':hover': hover })}>
                hello, world!
              </div>
            )}
          </ClassNames>
        );
      `);

      expect(actual).toIncludeMultiple([':hover{color:red}', '{font-size:20px}']);
    });

    it('a declared string literal', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const color = 'red';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => (
              <div className={css({ color, margin: 0 })} style={style}>
                hello, world!
              </div>
            )}
          </ClassNames>
        );
      `);

      expect(actual).toIncludeMultiple(['{color:red}', '{margin-top:0}']);
    });

    it('a spread element that references an object expression', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const mixin = { color: 'red' };

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => (
              <div className={css({ color: 'blue', ...mixin })} style={style}>
                hello, world!
              </div>
            )}
          </ClassNames>
        );
      `);

      expect(actual).toIncludeMultiple(['{color:red}']);
    });

    it('a dynamic property value using inline styles', () => {
      const code = `
        import { ClassNames } from '@compiled/react';
        import { useState } from 'react';

        const [fontSize] = useState('10px');

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => (
              <div className={css({ fontSize })} style={style}>
                hello, world!
              </div>
            )}
          </ClassNames>
        );
      `;

      const actual = transform(code, { pretty: false });

      expect(actual).toIncludeMultiple([
        'style={{"--_1j2e0s2":ix(fontSize)}}',
        'font-size:var(--_1j2e0s2)',
      ]);
    });

    it('a dynamic property value and suffix using inline styles', () => {
      const code = `
        import { ClassNames } from '@compiled/react';
        import { useState } from 'react';

        const fontSize = useState(20);

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => (
              <div className={css({ fontSize: \`\${fontSize}px\` })} style={style}>
                hello, world!
              </div>
            )}
          </ClassNames>
        );
      `;

      const actual = transform(code, { pretty: false });

      expect(actual).toIncludeMultiple([
        'style={{"--_1j2e0s2":ix(fontSize,"px")}}',
        'font-size:var(--_1j2e0s2)',
      ]);
    });

    it('a spread element call expression referencing an arrow function that returns an object expression', () => {
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
              {({ css }) => (
                <div className={css({ ...mixin({ color1: color.red, color2: 'blue' }, greenColor, 10) })} />
              )}
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

    it('a member call expression referencing an arrow function that returns an object expression', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const mixin = {
          value: (color1, r, color2) => ({
            color: color1,
            borderRadius: r,
            borderColor: color2,
          })
        };

        const radius = 10;

        const Component = (props) => (
          <ClassNames>
            {({ css, style }) => (
              <div
                className={css({ ...mixin.value(props.color1, radius, 'red') })}
                style={style}
              />
            )}
          </ClassNames>
        );
      `);

      expect(actual).toIncludeMultiple([
        '"--_zo7lop": ix(props.color1)',
        '{border-radius:10px}',
        '{border-color:red}',
      ]);
    });

    it('a call expression with unresolved arguments', () => {
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
            {({ css, style }) => (
              <div
                className={css({ ...mixin(props.color1, radius) })}
                style={style}
              />
            )}
          </ClassNames>
        );
      `);

      expect(actual).toIncludeMultiple([
        '{color:var(--_zo7lop)}',
        '"--_zo7lop": ix(props.color1)',
        '{border-radius:10px}',
        '{font-weight:var(--_u6vle4)}',
        '"--_u6vle4": ix()',
        '{font-size:var(--_kre2x8)}',
        '"--_kre2x8": ix()',
      ]);
    });
  });
});
