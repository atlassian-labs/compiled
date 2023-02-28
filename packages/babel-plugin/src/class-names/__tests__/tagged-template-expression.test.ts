import { transform } from '../../test-utils';

describe('ClassNames used with a css tagged template expression', () => {
  describe('transforms a quasi that contains', () => {
    it('no expressions', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`font-size: 20px\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toIncludeMultiple([
        'const _ = "._1wybgktf{font-size:20px}"',
        'className={ax(["_1wybgktf"])}',
      ]);
    });

    it('a declared string literal expression', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const fontSize = '12px';

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`font-size: \${fontSize};\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`{font-size:12px}`);
    });

    it('a declared numeric literal expression', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const fontSize = 12;

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`font-size: \${fontSize};\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`{font-size:12}`);
    });

    it('a declared object expression', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const color = { color: 'blue' };

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`{color:blue}`);
    });

    it('a suffixed dynamic expression using inline styles', () => {
      const code = `
        import { ClassNames } from '@compiled/react';
        import { fontSize } from './nah';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => (
              <div style={style} className={css\`font-size: \${fontSize}px;\`}>
                hello, world!
              </div>
            )}
          </ClassNames>
        );
      `;

      const actual = transform(code, { pretty: false });

      expect(actual).toIncludeMultiple([
        'font-size:var(--_1j2e0s2)',
        'style={{"--_1j2e0s2":ix(fontSize,"px")}}',
      ]);
    });

    it('a zero arity call expression referencing an arrow function that returns an object expression', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const color = () => ({ color: 'blue' });

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color()}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`{color:blue}`);
    });

    it('a zero arity call expression referencing a function declaration that returns an object expression', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        function color() { return { color: 'blue' }; }

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color()}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

      expect(actual).toInclude(`{color:blue}`);
    });

    it('a multi arity call expression referencing an arrow function that returns an object expression', () => {
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
                <div
                  className={css\`
                    padding-top: 10px;
                    padding-bottom: 15px;
                    \${mixin({ color1: color.red, color2: 'blue' }, greenColor, 10)};
                    font-size: 20px;
                  \`}
                />
              )}
            </ClassNames>
          );
        };
      `);

      expect(actual).toIncludeMultiple([
        '{padding-top:10px}',
        '{padding-bottom:15px}',
        '{color:red}',
        '{background-color:blue}',
        '{border-color:green}',
        '{border-radius:10px}',
        '{font-size:20px}',
      ]);
    });

    it('a multi arity member call expression referencing an arrow function that returns an object expression', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const mixin = {
          value: (color1, r, color2) => ({
            color: color1,
            borderRadius: r,
            borderColor: color2
          })
        };

        const radius = 10;

        const Component = (props) => (
          <ClassNames>
            {({ css, style }) => (
              <div
                className={css\`
                  font-size: 20px;
                  \${mixin.value(props.color1, radius, 'red')};
                  font-weight: bold;
                \`}
                style={style}
              />
            )}
          </ClassNames>
        );
      `);

      expect(actual).toIncludeMultiple([
        'font-size:20px',
        '"--_zo7lop": ix(props.color1)',
        '{border-radius:10px}',
        '{border-color:red}',
        'font-weight:bold',
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
                className={css\`
                  border: 1px solid black;
                  \${mixin(props.color1, radius)};
                  margin-top: 20px;
                \`}
                style={style}
              />
            )}
          </ClassNames>
        );
      `);

      expect(actual).toIncludeMultiple([
        '{border:1px solid black}',
        '{color:var(--_zo7lop)}',
        '"--_zo7lop": ix(props.color1)',
        '{border-radius:10px}',
        '{font-weight:var(--_u6vle4)}',
        '"--_u6vle4": ix()',
        '{font-size:var(--_kre2x8)}',
        '"--_kre2x8": ix()',
        '{margin-top:20px}',
      ]);
    });

    it('duplicate properties', () => {
      const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const primary = () => ({
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'purple',
        });

        const secondary = {
          border: '1px solid red'
        };

        const Component = (props) => (
          <ClassNames>
            {({ css }) => (
              <div
                className={css\`
                  \${primary()};
                  font-size: 30px;
                  \${secondary};
                  color: blue;
                  border: 2px solid black;
                \`}
              />
            )}
          </ClassNames>
        );
      `);

      expect(actual).toIncludeMultiple([
        '{border:2px solid black}',
        '{color:blue}',
        '{font-size:30px}',
        '{font-weight:bold}',
      ]);
    });
  });
});
