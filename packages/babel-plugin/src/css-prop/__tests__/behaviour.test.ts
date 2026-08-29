import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';

describe('css prop behaviour', () => {
  beforeAll(() => {
    process.env.AUTOPREFIXER = 'off';
  });

  afterAll(() => {
    delete process.env.AUTOPREFIXER;
  });

  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, ...opts });

  it('should support satisfies expressions in computed at-rule keys', () => {
    const actual = transform(`
      import type { MediaAboveSm } from '@atlaskit/css/at-rules/media-above-sm';
      import '@compiled/react';

      <div css={{
        ['@media (min-width: 48rem)' satisfies MediaAboveSm]: { padding: '8px' },
      }} />;
    `);

    expect(actual).toIncludeMultiple([
      'const _="@media (min-width:48rem){._34ApswJg58{padding-top:8px}._0NZneVJg58{padding-right:8px}._0jj4l6Jg58{padding-bottom:8px}._4af1G0Jg58{padding-left:8px}}";',
      'className={ax(["_34ApswJg58 _0NZneVJg58 _0jj4l6Jg58 _4af1G0Jg58"])}',
    ]);
  });

  it('should not apply class name when no styles are present', () => {
    const actual = transform(`
      import '@compiled/react';

      <div css={{}} />
    `);

    expect(actual).toInclude('<div/>');
  });

  it('should replace css prop with class name', () => {
    const actual = transform(`
      import '@compiled/react';

      <div css={{}}>hello world</div>
    `);

    expect(actual).toInclude('<div>hello world</div>');
  });

  it('should pass through style identifier when there is no dynamic styles in the css', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = ({ className, style }) => (
        <div className={className} style={style} css={{ fontSize: 12 }}>
          hello world
        </div>
      );
    `);

    expect(actual).toInclude('style={style}');
  });

  it('should pass through style property access when there is no dynamic styles in the css', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = ({ className, ...props }) => (
        <div className={className} style={props.style} css={{ fontSize: 12 }}>
          hello world
        </div>
      );
    `);

    expect(actual).toInclude('style={props.style}');
  });

  it('should spread style identifier when there is dynamic styles in the css', () => {
    const actual = transform(`
      import '@compiled/react';

      const [fontSize] = React.useState('10px');
      const red = 'red';

      const Component = ({ className, style }) => (
        <div className={className} style={style} css={{ fontSize, color: red }}>
          hello world
        </div>
      );
    `);

    expect(actual).toInclude('style={{...style,"--_1j2e0s2":ix(fontSize)}}');
  });

  it('should spread style property access when there is dynamic styles in the css', () => {
    const actual = transform(`
      import '@compiled/react';

      const [background] = React.useState("violet");
      const red = 'red';

      const Component = ({ className, ...props }) => (
        <div className={className} style={props.style} css={{ fontSize: 12, color: red, background }}>
          hello world
        </div>
      );
    `);

    expect(actual).toInclude('style={{...props.style,"--_1k9t07z":ix(background)}}');
  });

  it('should spread style identifier when there is styles already set', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = ({ className, style }) => (
        <div className={className} style={{ ...style, display: 'block' }} css={{ fontSize: 12 }}>
          hello world
        </div>
      );
    `);

    expect(actual).toInclude(`style={{...style,display:'block'}}`);
  });

  it('should spread style identifier when there is styles already set and using dynamic css', () => {
    const actual = transform(`
      import '@compiled/react';

      const [background] = React.useState('yellow');
      const red = 'red';

      const Component = ({ className, style }) => (
        <div
          className={className}
          css={{ fontSize: 12, color: red, background }}
          style={{ ...style, display: 'block' }}
        >
          hello world
        </div>
      );
    `);

    expect(actual).toIncludeMultiple([
      `style={{...style,display:'block',\"--_1k9t07z\":ix(background)}}`,
      'color:red',
    ]);
  });

  it('should concat explicit use of class name prop on an element', () => {
    const actual = transform(`
      import '@compiled/react';

      <div className="foobar" css={{ display: 'block' }}>hello world</div>
    `);

    expect(actual).toInclude('className={ax(["_3iDTPbvLZJ","foobar"])}');
  });

  it('should pass through spread props', () => {
    const actual = transform(`
      import '@compiled/react';

      const props = {};

      <div css={{ fontSize: 20 }} {...props} />
    `);

    expect(actual).toInclude('<div{...props}className={ax(["_4ya3eESPN1"])}/>');
  });

  it('should pass through static props', () => {
    const actual = transform(`
      import '@compiled/react';

      <div css={{ fontSize: 20 }} role="menu" />
    `);

    expect(actual).toInclude('<div role="menu"className={ax(["_4ya3eESPN1"])}/>');
  });

  it('should concat explicit use of class name prop from an identifier on an element', () => {
    const actual = transform(`
      import '@compiled/react';

      const className = "foobar";

      <div className={className} css={{ display: 'block' }} />
    `);

    expect(actual).toInclude('className={ax(["_3iDTPbvLZJ",className])}');
  });

  it('should pick up array composition', () => {
    const actual = transform(`
      import '@compiled/react';

      const base = { color: 'black' };
      const top = \` color: red; \`;

      <div css={[base, top]}>hello world</div>
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzGowl{color:red}',
      '._1UtDYzbqW0{color:black}',
      '<div className={ax(["_1UtDYzbqW0","_1UtDYzGowl"])}>hello world</div>',
    ]);
  });

  it('should pick up complex array composition', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      const base = { display: 'inline-block', color: 'black' };
      const top = css({ 'font-size': '12px', width: '50px' });

      <div css={[base, top]}>hello world</div>
    `);

    expect(actual).toIncludeMultiple([
      '._39xV02HMkp{width:50px}',
      '._4ya3eErjyG{font-size:12px}',
      '._1UtDYzbqW0{color:black}',
      '._3iDTPbvbI6{display:inline-block}',
      '<div className={ax(["_3iDTPbvbI6 _1UtDYzbqW0","_4ya3eErjyG _39xV02HMkp"])}>hello world</div>',
    ]);
  });

  it('should persist static style prop', () => {
    const actual = transform(`
      import '@compiled/react';

      <div style={{ display: 'block' }} css={{ color: 'blue' }}>hello world</div>
    `);

    expect(actual).toInclude(`{color:blue}`);
    expect(actual).toInclude(
      `<div style={{display:'block'}}className={ax([\"_1UtDYzynoA\"])}>hello world</div>`
    );
  });

  it('should concat explicit use of style prop on an element when destructured template', () => {
    const actual = transform(`
      import '@compiled/react';

      const colors = getColors();
      const [color] = colors;
      <div style={{ display: 'block' }} css={{ color: \`\${color}\` }}>hello world</div>
    `);

    expect(actual).toInclude(`color:var(--_1ylxx6h)`);
    expect(actual).toInclude(`style={{display:'block',\"--_1ylxx6h\":ix(color)}}`);
  });

  it('should place suffix into ix call', () => {
    const actual = transform(`
      import '@compiled/react';
      import { useState } from 'react';

      const size = useState(10);
      <div css={\` font-size: $\{size}px; \`}>hello world</div>
    `);

    expect(actual).toInclude(`ix(size,"px")`);
  });

  it('should concat implicit use of class name prop where class name is a jsx expression', () => {
    const actual = transform(`
      import '@compiled/react';

      const getFoo = () => 'foobar';

      <div css={{ display: 'block' }} className={getFoo()}>hello world</div>
    `);

    expect(actual).toInclude('className={ax(["_3iDTPbvLZJ",getFoo()])}');
  });

  it('should allow inlined expressions as property values', () => {
    const actual = transform(`
      import '@compiled/react';

      let hello = true;
      hello = false;

      <div css={{ color: hello ? 'red' : 'blue', fontSize: 10 }}>hello world</div>
    `);

    expect(actual).toInclude('color:var(--_15b8wfu)');
    expect(actual).toInclude('font-size:10px');
    expect(actual).toInclude(`style={{\"--_15b8wfu\":ix(hello?'red':'blue')}}`);
  });

  it('should inline multi interpolation constant variable', () => {
    // See: https://codesandbox.io/s/dank-star-443ps?file=/src/index.js
    const actual = transform(`
      import '@compiled/react';

      const N30 = 'gray';

      <div css={{
        backgroundImage: \`linear-gradient(45deg, \${N30} 25%, transparent 25%),
        linear-gradient(-45deg, \${N30} 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, \${N30} 75%),
        linear-gradient(-45deg, transparent 75%, \${N30} 75%)\`
      }}>hello world</div>
    `);

    expect(actual).toInclude(
      `{background-image:linear-gradient(45deg,gray 25%,transparent 25%),linear-gradient(-45deg,gray 25%,transparent 25%),linear-gradient(45deg,transparent 75%,gray 75%),linear-gradient(-45deg,transparent 75%,gray 75%)}`
    );
  });

  it('should move dynamic multi interpolation variable into css variable', () => {
    // See: https://codesandbox.io/s/dank-star-443ps?file=/src/index.js
    const actual = transform(`
      import '@compiled/react';

      let N30 = 'gray';
      N30 = 'blue';

      <div css={{
        backgroundImage: \`linear-gradient(45deg, \${N30} 25%, transparent 25%),
        linear-gradient(-45deg, \${N30} 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, \${N30} 75%),
        linear-gradient(-45deg, transparent 75%, \${N30} 75%)\`
      }}>hello world</div>
    `);

    expect(actual).toInclude(
      `{background-image:linear-gradient(45deg,var(--_1vrvste\) 25%,transparent 25%),linear-gradient(-45deg,var(--_1vrvste\) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,var(--_1vrvste\) 75%),linear-gradient(-45deg,transparent 75%,var(--_1vrvste\) 75%)}`
    );
    expect(actual).toInclude('style={{"--_1vrvste":ix(N30)}}');
  });

  it('should allow expressions stored in a variable as shorthand property values', () => {
    const actual = transform(`
      import '@compiled/react';

      let hello = true;
      hello = false;
      let color = hello ? 'red' : 'blue' ;

      <div css={{ color }}>hello world</div>
    `);

    expect(actual).toInclude('{color:var(--_1ylxx6h)}');
    expect(actual).toInclude(`style={{\"--_1ylxx6h\":ix(color)}}`);
  });

  it('should allow expressions stored in a variable as property values', () => {
    const actual = transform(`
      import '@compiled/react';

      let hello = true;
      hello = false;
      let colorsz = hello ? 'red' : 'blue' ;

      <div css={{ color: colorsz }}>hello world</div>
    `);

    expect(actual).toInclude('{color:var(--_19p4bcs)}');
    expect(actual).toInclude(`style={{\"--_19p4bcs\":ix(colorsz)}}`);
  });

  it('should remove css prop', () => {
    const actual = transform(`
      import '@compiled/react';

      const color = 'blue';

      <div css={{ color: color }} style={{ display: "block" }}>hello world</div>
    `);

    expect(actual).not.toInclude('css={');
  });

  it('should keep other props around', () => {
    const actual = transform(`
      import '@compiled/react';

      const color = 'blue';

      <div data-testid="yo" css={{ color: color }} style={{ display: "block" }}>hello world</div>
    `);

    expect(actual).toInclude('data-testid="yo"');
  });

  it('should add an identifier nonce to the style element', () => {
    const code = `
      import '@compiled/react';

      <div css={{ color: 'blue' }} />
    `;

    const actual = transform(code, { nonce: '__webpack_nonce__' });

    expect(actual).toInclude('<CS nonce={__webpack_nonce__}');
  });

  it('should bubble up top level pseudo inside a media atrule', () => {
    const actual = transform(`
      import '@compiled/react';

      const fontSize = 20;

      <div
        css={\`
          @media screen {
            :hover {
              color: red;
            }
          }
        \`}
      />
    `);

    expect(actual).toInclude(':hover{color:red}');
  });

  it('should bubble up top level pseduo inside a support atrule', () => {
    const actual = transform(`
      import '@compiled/react';

      const fontSize = 20;

      <div
        css={\`
          @supports (display: grid) {
            :hover {
              color: red;
            }
          }
        \`}
      />
    `);

    expect(actual).toInclude(':hover{color:red}');
  });

  it('should handle an animation that references an inline @keyframes', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      const styles = css\`
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          to {
            opacity: 0;
          }
        }

        animation: fadeOut 2s ease-in-out;
      \`;

      <div css={styles}>hello world</div>
    `);

    expect(actual).toIncludeMultiple([
      'const _2="@keyframes fadeOut{0%{opacity:1}50%{opacity:0.5}to{opacity:0}}"',
      'const _="._2fBhtekqVl{animation:fadeOut 2s ease-in-out}"',
      '<CS>{[_,_2]}</CS>',
      'className={ax(["_2fBhtekqVl"])}',
    ]);
  });

  it('should apply conditional logical expression object spread styles', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = props => (
        <div
          css={{
            ...props.isPrimary && {
              color: 'blue',
              fontSize: 20
            }
          }}
        />
      );
    `);

    expect(actual).toInclude('className={ax([props.isPrimary&&"_1UtDYzynoA _4ya3eESPN1"])}');
  });

  it('should apply inverse conditional logical expression object spread', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = props => (
        <div
          css={{
            ...props.isPrimary || {
              color: 'blue',
              fontSize: 20
            }
          }}
        />
      );
    `);

    expect(actual).toInclude('className={ax([props.isPrimary||"_1UtDYzynoA _4ya3eESPN1"])}');
  });

  it('should apply conditional logical expression object styles', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = props => (
        <div
          css={{
            ':hover': props.isPrimary && {
              color: 'blue',
              fontSize: 20
            }
          }}
        />
      );
    `);

    expect(actual).toInclude('className={ax([props.isPrimary&&"_0clgaMynoA _0WjAIgSPN1"])}');
  });

  it('should combine conditional logical expressions', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = props => (
        <div
          css={{
            ':hover': props.isPrimary && {
              color: 'blue',
              ...props.isBold && {
                fontWeight: 700
              }
            }
          }}
        />
      );
    `);

    expect(actual).toInclude(
      'className={ax([props.isPrimary&&"_0clgaMynoA",props.isPrimary&&props.isBold&&"_0tHyJKkKjW"])}'
    );
  });

  it('should apply multi conditional logical expression', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = props => (
        <div
          css={{
            ...(props.isPrimary || props.isMaybe) && {
              color: 'blue',
              fontSize: 20,
            }
          }}
        />
      );
    `);

    expect(actual).toInclude('ax([(props.isPrimary||props.isMaybe)&&"_1UtDYzynoA _4ya3eESPN1"])');
  });

  it('should apply array logical-based conditional css', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = props => (
        <div
          css={[
            { fontSize: 40, },
            (props.isPrimary || props.isMaybe) && {
              color: 'blue',
              fontSize: 20,
            },
          ]}
        />
      );
    `);

    expect(actual).toInclude(
      'ax(["_4ya3eEUF4f",(props.isPrimary||props.isMaybe)&&"_1UtDYzynoA _4ya3eESPN1"])'
    );
  });

  it('should apply array prop ternary-based inline conditional css', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      const Component = ({ isPrimary }) => (
        <div
          css={[
            isPrimary
              ? { background: 'white', color: 'black' }
              : css({ background: 'green', color: 'red' }),
            css({ 'font-size': '12px' })
          ]}
        />
      );
    `);

    expect(actual).toIncludeMultiple([
      '._0KLXruaJpK{background-color:white}',
      '._1UtDYzbqW0{color:black}',
      '._0KLXruJwxv{background-color:green}',
      '._1UtDYzGowl{color:red}',
      '._4ya3eErjyG{font-size:12px}',
      '<div className={ax([isPrimary?"_0KLXruaJpK _1UtDYzbqW0":"_0KLXruJwxv _1UtDYzGowl","_4ya3eErjyG"])}/>',
    ]);
  });

  it('should apply array prop ternary-based conditional css that reference css variable declarations', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      const positive = css({ background: 'white', color: 'black' });
      const negative = css\`
        background: green;
        color: red;
      \`;

      const Component = ({ isPrimary }) => (
        <div
          css={[
            isPrimary ? positive : negative,
            css({ 'font-size': '12px' })
          ]}
        />
      );
    `);

    expect(actual).toIncludeMultiple([
      '._0KLXruaJpK{background-color:white}',
      '._1UtDYzbqW0{color:black}',
      '._0KLXruJwxv{background-color:green}',
      '._1UtDYzGowl{color:red}',
      '._4ya3eErjyG{font-size:12px}',
      '<div className={ax([isPrimary?"_0KLXruaJpK _1UtDYzbqW0":"_0KLXruJwxv _1UtDYzGowl","_4ya3eErjyG"])}/>',
    ]);
  });

  it('should apply partial logical-based conditional css rule', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = props => (
        <div
          css={{
            ...props.isPrimary && {
              color: 'blue',
              fontSize: 20,
            },
            border: '1px solid black',
          }}
        >
          hello world
        </div>
      );
    `);

    expect(actual).toInclude('ax([props.isPrimary&&"_1UtDYzynoA _4ya3eESPN1","_30huDK2Tva"])');
  });

  it('should apply unconditional before and after a conditional css rule', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = props => (
        <div
          css={{
          fontSize: 15,
          ...props.isPrimary && {
            color: 'blue',
            fontSize: 20,
          },
          border: '1px solid black',
        }}>hello world</div>
      );
    `);

    expect(actual).toInclude(
      'ax(["_4ya3eE2sAl",props.isPrimary&&"_1UtDYzynoA _4ya3eESPN1","_30huDK2Tva"])'
    );
  });

  it('should use destructured props in conditional css rule', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = ({ isPrimary }) => (
        <div
          css={{
            ...isPrimary && {
              color: 'blue',
              fontSize: 20
            }
          }}
        />
      );
    `);

    expect(actual).toInclude('ax([isPrimary&&"_1UtDYzynoA _4ya3eESPN1"])');
  });

  it('should retain keys for mapped react components', () => {
    const actual = transform(`
      import '@compiled/react';

      ['foo', 'bar'].map((str) => (
        <div key={str} css={{ backgroundColor: 'blue' }}>
          {str}
        </div>
      ));
    `);

    expect(actual).toInclude('<CC key={str}>');
  });

  it('should not transform css prop with comment directive', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      // @compiled-disable-next-line transform-css-prop
      const RedDiv = <div css={{ color: 'red' }} />;

      const GreenDiv = () => (
        <div
          css={ css\`color: green\` } // @compiled-disable-line transform-css-prop
        />
      );

      const BlueDiv = () => (
        <div
          // @compiled-disable-next-line transform-css-prop
          css={{ color: 'blue' }}
        />
      );
    `);

    expect(actual).toIncludeMultiple(["css={{color:'red'}}", 'css={null}', "css={{color:'blue'}}"]);
  });
});
