import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';

describe('class names behaviour', () => {
  beforeAll(() => {
    process.env.AUTOPREFIXER = 'off';
  });

  afterAll(() => {
    delete process.env.AUTOPREFIXRER;
  });

  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { snippet: true, ...opts });

  it('should transform class names single usage', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const ListItem = () => (
        <ClassNames>
          {({ css }) => (<div className={css({ fontSize: '20px' })}>hello, world!</div>)}
        </ClassNames>
      );
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const _ = "._1wybgktf{font-size:20px}";
      const ListItem = () => (
        <CC>
          <CS>{[_]}</CS>
          {<div className={ax(["_1wybgktf"])}>hello, world!</div>}
        </CC>
      );
      "
    `);
  });

  it('should transform children as function with body', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const ListItem = () => (
        <ClassNames>
          {({ css }) => {
            return <div className={css({ fontSize: '20px' })}>hello, world!</div>;
          }}
        </ClassNames>
      );
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const _ = "._1wybgktf{font-size:20px}";
      const ListItem = () => (
        <CC>
          <CS>{[_]}</CS>
          {(() => {
            return <div className={ax(["_1wybgktf"])}>hello, world!</div>;
          })()}
        </CC>
      );
      "
    `);
  });

  it('should transform style property access', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const ListItem = () => (
        <ClassNames>
          {(props) => (<div style={props.style}>hello, world!</div>)}
        </ClassNames>
      );
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const ListItem = () => (
        <CC>
          <CS>{[]}</CS>
          {<div style={undefined}>hello, world!</div>}
        </CC>
      );
      "
    `);
  });

  it('should transform css property access', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const ListItem = () => (
        <ClassNames>
          {(props) => (<div className={props.css({ fontSize: '20px' })}>hello, world!</div>)}
        </ClassNames>
      );
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const _ = "._1wybgktf{font-size:20px}";
      const ListItem = () => (
        <CC>
          <CS>{[_]}</CS>
          {<div className={ax(["_1wybgktf"])}>hello, world!</div>}
        </CC>
      );
      "
    `);
  });

  it('should transform keyframes', () => {
    const actual = transform(`
      import { ClassNames, keyframes } from '@compiled/react';

      const fadeOut = keyframes({
        from: {
          opacity: 1,
        },
        to: {
          opacity: 0,
        },
      });

      const Component = () => (
        <ClassNames>
          {({ css }) => (
              <>
                <div className={css({
                  animationDuration: '2s',
                  animationName: fadeOut,
                  animationTimingFunction: 'ease-in-out',
                })}>
                  longhand object call expression
                </div>
                <div className={css({ animation: \`\${fadeOut} 2s ease-in-out\` })}>
                  shorthand object call expression
                </div>
                <div className={css\`
                  animation-duration: 2s;
                  animation-name: \${fadeOut};
                  animation-timing-function: ease-in-out;
                \`}>
                  longhand tagged template expression
                </div>
                <div className={css\`
                  animation: \${fadeOut} 2s ease-in-out;
                \`}>
                  shorthand tagged template expression
                </div>
              </>
          )}
        </ClassNames>
      );
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const _5 = "._y44vonb9{animation:k1m8j3od 2s ease-in-out}";
      const _4 = "._1pgl1ytf{animation-timing-function:ease-in-out}";
      const _3 = "._j7hq1sbx{animation-name:k1m8j3od}";
      const _2 = "._5sagymdr{animation-duration:2s}";
      const _ = "@keyframes k1m8j3od{0%{opacity:1}to{opacity:0}}";
      const fadeOut = null;
      const Component = () => (
        <CC>
          <CS>{[_, _2, _3, _4, _5]}</CS>
          {
            <>
              <div className={ax(["_5sagymdr _j7hq1sbx _1pgl1ytf"])}>
                longhand object call expression
              </div>
              <div className={ax(["_y44vonb9"])}>
                shorthand object call expression
              </div>
              <div className={ax(["_5sagymdr _j7hq1sbx _1pgl1ytf"])}>
                longhand tagged template expression
              </div>
              <div className={ax(["_y44vonb9"])}>
                shorthand tagged template expression
              </div>
            </>
          }
        </CC>
      );
      "
    `);
  });

  it('should not transform object property access from invalid style prop', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const ListItem = () => (
        <ClassNames>
          {(props) => (<div style={dontexist.style}>hello, world!</div>)}
        </ClassNames>
      );
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const ListItem = () => (
        <CC>
          <CS>{[]}</CS>
          {<div style={dontexist.style}>hello, world!</div>}
        </CC>
      );
      "
    `);
  });

  it('should transform style renamed prop usage', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const ListItem = () => (
        <ClassNames>
          {({ style: styl }) => (<div style={styl}>hello, world!</div>)}
        </ClassNames>
      );
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const ListItem = () => (
        <CC>
          <CS>{[]}</CS>
          {<div style={undefined}>hello, world!</div>}
        </CC>
      );
      "
    `);
  });

  it('should transform class names renamed prop single usage', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const ListItem = () => (
        <ClassNames>
          {({ css: c }) => (<div className={c({ fontSize: '20px' })}>hello, world!</div>)}
        </ClassNames>
      );
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const _ = "._1wybgktf{font-size:20px}";
      const ListItem = () => (
        <CC>
          <CS>{[_]}</CS>
          {<div className={ax(["_1wybgktf"])}>hello, world!</div>}
        </CC>
      );
      "
    `);
  });

  it('should transform class names multiple usage', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const ListItem = () => (
        <ClassNames>
          {({ css }) => (
            <div
              className={{
                button: css({ color: 'red', fontSize: 20 }),
                container: css({ color: 'blue', fontSize: 20 }),
              }}>hello, world!</div>
          )}
        </ClassNames>
      );
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const _3 = "._syaz13q2{color:blue}";
      const _2 = "._1wybgktf{font-size:20px}";
      const _ = "._syaz5scu{color:red}";
      const ListItem = () => (
        <CC>
          <CS>{[_, _2, _3]}</CS>
          {
            <div
              className={{
                button: ax(["_syaz5scu _1wybgktf"]),
                container: ax(["_syaz13q2 _1wybgktf"]),
              }}
            >
              hello, world!
            </div>
          }
        </CC>
      );
      "
    `);
  });

  it('should transform class names renamed usage', () => {
    const actual = transform(`
      import { ClassNames as CN } from '@compiled/react';

      const ListItem = () => (
        <CN>
          {({ css }) => <div className={css({ fontSize: '20px' })}>hello, world!</div>}
        </CN>
      );
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const _ = "._1wybgktf{font-size:20px}";
      const ListItem = () => (
        <CC>
          <CS>{[_]}</CS>
          {<div className={ax(["_1wybgktf"])}>hello, world!</div>}
        </CC>
      );
      "
    `);
  });

  it('should add an identifier nonce to the style element', () => {
    const code = `
      import { ClassNames } from '@compiled/react';

      const ListItem = () => (
        <ClassNames>
          {({ css }) => (<div className={css({ fontSize: '20px' })}>hello, world!</div>)}
        </ClassNames>
      );
    `;

    const actual = transform(code, { nonce: '__webpack_nonce__' });

    expect(actual).toInclude('<CS nonce={__webpack_nonce__}>');
  });

  it('should transform children as function return', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const ListItem = ({ children }) => (
        <ClassNames>
          {({ css }) => children(css({ fontSize: '20px' }))}
        </ClassNames>
      );
   `);

    expect(actual).toMatchInlineSnapshot(`
      "const _ = "._1wybgktf{font-size:20px}";
      const ListItem = ({ children }) => (
        <CC>
          <CS>{[_]}</CS>
          {children(ax(["_1wybgktf"]))}
        </CC>
      );
      "
    `);
  });

  it('should place self closing jsx element as a child', () => {
    const actual = transform(`
    import { ClassNames } from '@compiled/react';

    const ZoomOnHover = ({ children }) => (
      <ClassNames>
        {({ css }) => <div className={css({ fontSize: 12 })} />}
      </ClassNames>
    );
  `);

    expect(actual).toInclude(`<div className={ax([\"_1wyb1fwx\"])} /`);
  });

  it('should replace style identifier with undefined', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const Component = ({ children }) => (
        <ClassNames>
          {({ css, style }) => <div style={style} className={css({ fontSize: 12 })} />}
        </ClassNames>
      );
  `);

    expect(actual).toInclude(`style={undefined}`);
  });

  it('should replace style identifier with css variable object', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const Component = ({ children, color }) => (
        <ClassNames>
          {({ css, style }) => <div style={style} className={css({ color })} />}
        </ClassNames>
      );
  `);

    expect(actual).toMatchInlineSnapshot(`
      "const _ = "._syaz1aj3{color:var(--_1ylxx6h)}";
      const Component = ({ children, color }) => (
        <CC>
          <CS>{[_]}</CS>
          {
            <div
              style={{
                "--_1ylxx6h": ix(color),
              }}
              className={ax(["_syaz1aj3"])}
            />
          }
        </CC>
      );
      "
    `);
  });

  it('should not transform style identifier when its coming from outer scope', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const EmphasisText = ({ className, children, style }) => (
        <ClassNames>
          {({ css }) => (
            <span
              style={style}
              className={
                css({
                  color: '#00b8d9',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }) +
                ' ' +
                className
              }>
              {children}
            </span>
          )}
        </ClassNames>
      );
  `);

    expect(actual).toInclude(`style={style}`);
  });

  it('should transform style and css renamed prop coming from local variable', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const ListItem = () => (
        <ClassNames>
          {(arg) => {
            const { css: c, style: styl } = arg;

            return (
              <div
                style={styl}
                className={c({ fontSize: 10, color: 'red'})}>
                hello world
              </div>
            );
          }}
        </ClassNames>
      );
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const _2 = "._syaz5scu{color:red}";
      const _ = "._1wyb19bv{font-size:10px}";
      const ListItem = () => (
        <CC>
          <CS>{[_, _2]}</CS>
          {(() => {
            const { css: c, style: styl } = arg;
            return (
              <div style={undefined} className={ax(["_1wyb19bv _syaz5scu"])}>
                hello world
              </div>
            );
          })()}
        </CC>
      );
      "
    `);
  });

  it('should apply conditional logical expression object spread styles', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      const ListItem = (props) => (
        <ClassNames>
          {({ css }) => (<div className={css({ 
            ...props.isPrimary && {
            color: 'blue',
            fontSize: 20
          }})}>hello, world!</div>)}
        </ClassNames>
      );
    `);

    expect(actual).toInclude('className={ax([props.isPrimary && "_syaz13q2 _1wybgktf"])}');
  });

  it('should apply array logical-based conditional css', () => {
    const actual = transform(
      `
      import { ClassNames } from '@compiled/react';

      const ListItem = (props) => (
        <ClassNames>
          {({ css }) => (<div className={css([
            { fontSize: 40, },
            (props.isPrimary || props.isMaybe) && {
              color: 'blue',
              fontSize: 20,
            },
          ])}>hello, world!</div>)}
        </ClassNames>
      );
    `,
      { pretty: false }
    );

    expect(actual).toInclude(
      'className={ax(["_1wyb1ylp",(props.isPrimary||props.isMaybe)&&"_syaz13q2 _1wybgktf"])}'
    );
  });

  it('should apply array prop ternary-based inline conditional css', () => {
    const actual = transform(
      `
      import { ClassNames } from '@compiled/react';

      const ListItem = (props) => (
        <ClassNames>
          {({ css }) => (<div className={css([
            props.isPrimary
              ? { background: 'white', color: 'black' }
              : { background: 'green', color: 'red' },
            { 'font-size': '12px' }
          ])}>hello, world!</div>)}
        </ClassNames>
      );
    `,
      { pretty: false }
    );

    expect(actual).toInclude(
      'className={ax([props.isPrimary?"_bfhk1x77 _syaz11x8":"_bfhkbf54 _syaz5scu","_1wyb1fwx"])}'
    );
  });
});
