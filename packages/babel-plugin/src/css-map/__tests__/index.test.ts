import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';
import { ErrorMessages } from '../../utils/css-map';

describe('css map basic functionality', () => {
  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, ...opts });

  const styles = `{
      danger: {
          color: 'red',
          backgroundColor: 'red'
      },
      success: {
        color: 'green',
        backgroundColor: 'green'
      }
    }`;

  it('should transform css map', () => {
    const actual = transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap(${styles});

      const Component = () => <div>
        <span css={styles.danger} />
        <span css={styles.success} />
      </div>
    `);

    expect(actual).toIncludeMultiple([
      'const styles={danger:"_syaz5scu _bfhk5scu",success:"_syazbf54 _bfhkbf54"};',
      '<span className={ax([styles.danger])}/>',
      '<span className={ax([styles.success])}/>',
    ]);
  });

  it('should transform css map when the styles are defined below the component and the component uses xcss prop', () => {
    const actual = transform(
      `
      import { cssMap } from '@compiled/react';

      <Box xcss={styles.danger} />

      const styles = cssMap(${styles});
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _4 = "._bfhkbf54{background-color:green}";
      const _3 = "._syazbf54{color:green}";
      const _2 = "._bfhk5scu{background-color:red}";
      const _ = "._syaz5scu{color:red}";
      <CC>
        <CS>{[_, _2, _3, _4]}</CS>
        {<Box xcss={styles.danger} />}
      </CC>;
      const styles = {
        danger: "_syaz5scu _bfhk5scu",
        success: "_syazbf54 _bfhkbf54",
      };
      "
    `);
  });

  it('should transform css map even when the styles are defined below the component', () => {
    const actual = transform(`
      import { cssMap } from '@compiled/react';

      const Component = () => <div>
        <span css={styles.danger} />
        <span css={styles.success} />
      </div>

      const styles = cssMap(${styles});
    `);

    expect(actual).toIncludeMultiple([
      'const styles={danger:"_syaz5scu _bfhk5scu",success:"_syazbf54 _bfhkbf54"};',
      '<span className={ax([styles.danger])}/>',
      '<span className={ax([styles.success])}/>',
    ]);
  });

  it('should transform css map even with an empty object', () => {
    const actual = transform(`
        import { css, cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: {},
          success: {
            color: 'green',
            backgroundColor: 'green'
          }
        });
      `);

    expect(actual).toInclude('const styles={danger:"",success:"_syazbf54 _bfhkbf54"};');
  });

  it('should transform ternary-based conditional referencing cssMap declarations', () => {
    const actual = transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        root: { display: 'block' },
        positive: { background: 'white', color: 'black' },
        negative: { background: 'green', color: 'red' },
        bold: { fontWeight: 'bold' },
        normal: { fontWeight: 'normal' },
      });

      const Component = ({ isPrimary, weight }) => (
        <div
          css={[
            styles.root,
            weight in styles ? styles[weight] : styles.normal,
            isPrimary ? styles.positive : styles.negative,
          ]}
        />
      );
    `);

    expect(actual).toIncludeMultiple([
      '._1e0c1ule{display:block}',
      '._bfhk1x77{background-color:white}',
      '._syaz11x8{color:black}',
      '._bfhkbf54{background-color:green}',
      '._syaz5scu{color:red}',
      '._k48p8n31{font-weight:bold}',
      '._k48p4jg8{font-weight:normal}',
      'const styles={root:"_1e0c1ule",positive:"_bfhk1x77 _syaz11x8",negative:"_bfhkbf54 _syaz5scu",bold:"_k48p8n31",normal:"_k48p4jg8"}',
      '<div className={ax([styles.root,weight in styles?styles[weight]:styles.normal,isPrimary?styles.positive:styles.negative])}/>',
    ]);
  });

  it('should error out if the root cssMap object is being directly called', () => {
    expect(() => {
      transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({ root: { color: 'red' } });

      // Eg. we expect 'styles.root' here instead of 'styles'
      <div css={styles} />
    `);
    }).toThrow(ErrorMessages.USE_VARIANT_OF_CSS_MAP);

    expect(() => {
      transform(`
      import { cssMap } from '@compiled/react';

      // Eg. we expect 'styles.root' here instead of 'styles'
      <div css={styles} />

      const styles = cssMap({ root: { color: 'red' } });
    `);
    }).toThrow(
      'This CallExpression was unable to have its styles extracted — try to define them statically using Compiled APIs instead'
    );
  });

  it('should error out if variants are not defined at the top-most scope of the module.', () => {
    expect(() => {
      transform(`
      import { cssMap } from '@compiled/react';

      const styles = {
        map1: cssMap(${styles}),
      }
    `);
    }).toThrow(ErrorMessages.DEFINE_MAP);

    expect(() => {
      transform(`
      import { cssMap } from '@compiled/react';

      const styles = () => cssMap(${styles})
    `);
    }).toThrow(ErrorMessages.DEFINE_MAP);
  });

  it('should error out if cssMap receives more than two arguments', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap(${styles}, ${styles}, {})
      `);
    }).toThrow(ErrorMessages.NUMBER_OF_ARGUMENT);
  });

  it('should error out if cssMap does not receive an object', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap('color: red')
      `);
    }).toThrow(ErrorMessages.ARGUMENT_TYPE);
  });

  it('should error out if spread element is used', () => {
    expect(() => {
      transform(`
        import { css, cssMap } from '@compiled/react';

        const styles = cssMap({
          ...base
        });
      `);
    }).toThrow(ErrorMessages.NO_SPREAD_ELEMENT);
  });

  it('should error out if object method is used', () => {
    expect(() => {
      transform(`
        import { css, cssMap } from '@compiled/react';

        const styles = cssMap({
          danger() {}
        });
      `);
    }).toThrow(ErrorMessages.NO_OBJECT_METHOD);
  });

  it('should error out if variant object is dynamic', () => {
    expect(() => {
      transform(`
        import { css, cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: otherStyles
        });
      `);
    }).toThrow(ErrorMessages.STATIC_VARIANT_OBJECT);
  });

  it('should error out if styles include runtime variables', () => {
    expect(() => {
      transform(`
        import { css, cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: {
            color: canNotBeStaticallyEvulated
          }
        });
      `);
    }).toThrow(ErrorMessages.STATIC_VARIANT_OBJECT);
  });

  it('should error out if styles include conditional CSS', () => {
    expect(() => {
      transform(`
        import { css, cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: {
            color: canNotBeStaticallyEvulated ? 'red' : 'blue'
          }
        });
      `);
    }).toThrow(ErrorMessages.STATIC_VARIANT_OBJECT);
  });

  it('should error out if options argument is not an object', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap(${styles}, 'invalid');
      `);
    }).toThrow(ErrorMessages.OPTS_ARGUMENT_TYPE);
  });
});

describe('css map — atomic: false option', () => {
  // Use a stable filename so class names derived from hash(filename + variantKey)
  // are deterministic and meaningful in tests, matching real-world build behaviour.
  const FIXTURE_FILENAME = 'test/css-map-non-atomic.tsx';
  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, filename: FIXTURE_FILENAME, ...opts });
  const transformPretty = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: true, filename: FIXTURE_FILENAME, ...opts });

  const styles = `{
      danger: {
          color: 'red',
          backgroundColor: 'red'
      },
      success: {
        color: 'green',
        backgroundColor: 'green'
      }
    }`;

  it('should produce valid cc- class names even when filename is undefined', () => {
    // When babel is invoked without a filename (e.g. in tests or programmatic usage),
    // meta.state.filename is undefined. The class name falls back to
    // hash('undefined:variantKey') which is still stable and valid.
    const actual = transformCode(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        danger: { color: 'red' },
      }, { atomic: false });
      const C = () => <div css={styles.danger} />;
    `,
      { pretty: false }
      // Note: no filename passed — meta.state.filename will be undefined
    );

    // Class name is cc-<hash("undefined:danger")> — stable and valid despite no filename.
    expect(actual).toMatch(/danger:"cc-[a-z0-9]+"/);
    // The class is still properly scoped in the CSS sheet
    expect(actual).toMatch(/\.cc-[a-z0-9]+\{color:red\}/);
  });

  it('should produce one non-atomic cc- class per variant instead of multiple atomic _ classes', () => {
    const actual = transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        danger: {
            color: 'red',
            backgroundColor: 'red'
        },
        success: {
          color: 'green',
          backgroundColor: 'green'
        }
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      }, { atomic: false });

      const Component = () => <div>
        <span css={styles.danger} />
        <span css={styles.success} />
      </div>
    `);

    // Each variant emits exactly ONE class with a "cc-" prefix (no "_" prefix).
    // No "_" prefix means ax() treats it as an opaque plain string, not an atomic group.
    const dangerMatch = actual.match(/danger:"(cc-[^"]+)"/);
    const successMatch = actual.match(/success:"(cc-[^"]+)"/);
    expect(dangerMatch).toBeTruthy();
    expect(successMatch).toBeTruthy();
    // Different variants → different class names (different CSS content)
    expect(dangerMatch![1]).not.toBe(successMatch![1]);
    // ax() is still used at the call site (it safely ignores non-_ classes)
    expect(actual).toIncludeMultiple([
      '<span className={ax([styles.danger])}/>',
      '<span className={ax([styles.success])}/>',
    ]);
  });

  it('should scope pseudo-selectors under the single non-atomic class', () => {
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        danger: { color: 'red', '&:hover': { color: 'darkred' } },
        success: { color: 'green' },
      }, { atomic: false });
      const C = () => <div css={styles.danger} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _3 = ".cc-7yw089{color:green}";
      const _2 = ".cc-aojfb:hover{color:darkred}";
      const _ = ".cc-aojfb{color:red}";
      const styles = {
        danger: "cc-aojfb",
        success: "cc-7yw089",
      };
      const C = () => (
        <CC>
          <CS>{[_, _2, _3]}</CS>
          {<div className={ax([styles.danger])} />}
        </CC>
      );
      "
    `);
  });

  it('should preserve and correctly scope at-rules under the single non-atomic class', () => {
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        root: {
          color: 'red',
          '@media (min-width: 768px)': { color: 'blue' },
        },
      }, { atomic: false });
      const C = () => <div css={styles.root} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = "@media (min-width:768px){.cc-12ll4nl{color:blue}}";
      const _ = ".cc-12ll4nl{color:red}";
      const styles = {
        root: "cc-12ll4nl",
      };
      const C = () => (
        <CC>
          <CS>{[_, _2]}</CS>
          {<div className={ax([styles.root])} />}
        </CC>
      );
      "
    `);
  });

  it('should produce an empty string class name for an empty variant', () => {
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        empty: {},
        solid: { color: 'red' },
      }, { atomic: false });
      const C = () => <div css={styles.solid} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = ".cc-1s78kp8{color:red}";
      const styles = {
        empty: "cc-qqt14v",
        solid: "cc-1s78kp8",
      };
      const C = () => (
        <CC>
          <CS>{[_]}</CS>
          {<div className={ax([styles.solid])} />}
        </CC>
      );
      "
    `);
  });

  it('should support dynamic variant selection via bracket notation', () => {
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        danger: { color: 'red', backgroundColor: 'pink' },
        success: { color: 'green', backgroundColor: 'lightgreen' },
      }, { atomic: false });
      const C = ({ variant }) => <div css={styles[variant]} />;
    `,
      { pretty: true }
    );

    // All variant sheets are hoisted. The single non-atomic class for the selected
    // variant is resolved at runtime via styles[variant].
    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _4 = ".cc-7yw089{background-color:lightgreen}";
      const _3 = ".cc-7yw089{color:green}";
      const _2 = ".cc-aojfb{background-color:pink}";
      const _ = ".cc-aojfb{color:red}";
      const styles = {
        danger: "cc-aojfb",
        success: "cc-7yw089",
      };
      const C = ({ variant }) => (
        <CC>
          <CS>{[_, _2, _3, _4]}</CS>
          {<div className={ax([styles[variant]])} />}
        </CC>
      );
      "
    `);
  });

  it('should support conditional variant application via logical &&', () => {
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        danger: { color: 'red' },
        success: { color: 'green' },
      }, { atomic: false });
      const C = ({ isDanger }) => <div css={isDanger && styles.danger} />;
    `,
      { pretty: true }
    );

    // When isDanger is false, ax([false]) → no class applied.
    // When isDanger is true, ax(['cc-wq229y']) → 'cc-wq229y' applied.
    // ax() safely passes non-_ classes through without any atomic deduplication.
    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = ".cc-7yw089{color:green}";
      const _ = ".cc-aojfb{color:red}";
      const styles = {
        danger: "cc-aojfb",
        success: "cc-7yw089",
      };
      const C = ({ isDanger }) => (
        <CC>
          <CS>{[_, _2]}</CS>
          {<div className={ax([isDanger && styles.danger])} />}
        </CC>
      );
      "
    `);
  });

  it('should support multiple conditional variants applied together', () => {
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        base: { color: 'red', padding: '8px' },
        selected: { backgroundColor: 'blue' },
        disabled: { opacity: 0.5 },
      }, { atomic: false });
      const C = ({ isSelected, isDisabled }) => (
        <div css={[styles.base, isSelected && styles.selected, isDisabled && styles.disabled]} />
      );
    `,
      { pretty: true }
    );

    // All sheets are hoisted. The className receives up to 3 non-atomic classes at runtime:
    //   cc-1uj13gm (always: base)
    //   cc-dmm7lx  (when isSelected)
    //   cc-y8lilm  (when isDisabled)
    // Unlike atomic CSS, there is no deduplication between these classes —
    // they are all distinct opaque class names. CSS source order determines
    // which declarations win when the same property appears in multiple variants.
    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _7 = ".cc-1l611fe{opacity:0.5}";
      const _6 = ".cc-hyeuh3{background-color:blue}";
      const _5 = ".cc-1uu75r3{padding-left:8px}";
      const _4 = ".cc-1uu75r3{padding-bottom:8px}";
      const _3 = ".cc-1uu75r3{padding-right:8px}";
      const _2 = ".cc-1uu75r3{padding-top:8px}";
      const _ = ".cc-1uu75r3{color:red}";
      const styles = {
        base: "cc-1uu75r3",
        selected: "cc-hyeuh3",
        disabled: "cc-1l611fe",
      };
      const C = ({ isSelected, isDisabled }) => (
        <CC>
          <CS>{[_, _2, _3, _4, _5, _6, _7]}</CS>
          {
            <div
              className={ax([
                styles.base,
                isSelected && styles.selected,
                isDisabled && styles.disabled,
              ])}
            />
          }
        </CC>
      );
      "
    `);
  });

  it('should scope nested class selectors under the single non-atomic class', () => {
    // Mirrors the most common editor pattern: a variant contains ONLY nested class
    // selectors (no top-level declarations). The container element receives the cc-
    // class, and all child elements are styled via ".cc-xxx .child-class { ... }".
    // This is how editor styles like panelStyles, tableSharedStyle, mentionNodeStyles work.
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        panelStyles: {
          '.panel': { padding: '8px', backgroundColor: 'blue' },
          '.panel-title': { fontWeight: 'bold', color: 'blue' },
          '.panel-icon': { width: '24px', height: '24px' },
          '.panel-icon svg': { fill: 'currentColor' },
        },
        dangerStyles: {
          '.panel': { backgroundColor: 'pink' },
          '.panel-title': { color: 'red' },
        },
      }, { atomic: false });
      const C = ({ isDanger }) => <div css={[styles.panelStyles, isDanger && styles.dangerStyles]} />;
    `,
      { pretty: true }
    );

    // All nested class selectors become ".cc-xxx .child-class { ... }" —
    // the cc- variant class acts as a BEM-like scope prefix. Deep chains like
    // ".panel-icon svg" are also correctly prefixed. Variants with no top-level
    // declarations still get a stable cc- class name derived from their content.
    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _6 = ".cc-oljnhh .panel-title{color:red}";
      const _5 = ".cc-oljnhh .panel{background-color:pink}";
      const _4 = ".cc-2ax5o6 .panel-icon svg{fill:currentColor}";
      const _3 = ".cc-2ax5o6 .panel-icon{width:24px;height:24px}";
      const _2 = ".cc-2ax5o6 .panel-title{font-weight:bold;color:blue}";
      const _ =
        ".cc-2ax5o6 .panel{padding-top:8px;padding-right:8px;padding-bottom:8px;padding-left:8px;background-color:blue}";
      const styles = {
        panelStyles: "cc-2ax5o6",
        dangerStyles: "cc-oljnhh",
      };
      const C = ({ isDanger }) => (
        <CC>
          <CS>{[_, _2, _3, _4, _5, _6]}</CS>
          {
            <div
              className={ax([styles.panelStyles, isDanger && styles.dangerStyles])}
            />
          }
        </CC>
      );
      "
    `);
  });

  it('should handle nested at-rules combined with nested selectors', () => {
    // Mirrors editor patterns like layoutResponsiveBaseStyles, layoutBaseStyles
    // where @media / @container rules contain further nested selectors.
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        layoutStyles: {
          width: '100%',
          '@media (min-width: 768px)': {
            width: '50%',
            '& .inner': { padding: '16px' },
          },
        },
        compactStyles: {
          padding: '4px',
          '@media (min-width: 768px)': { padding: '8px' },
        },
      }, { atomic: false });
      const C = ({ isCompact }) => <div css={[styles.layoutStyles, isCompact && styles.compactStyles]} />;
    `,
      { pretty: true }
    );

    // Nested selectors inside @media are output as @media { .cc-xxx .inner { ... } }
    // — both the at-rule and the inner selector are correctly scoped.
    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _7 =
        "@media (min-width:768px){.cc-1wyxr0k{padding-top:8px}.cc-1wyxr0k{padding-right:8px}.cc-1wyxr0k{padding-bottom:8px}.cc-1wyxr0k{padding-left:8px}}";
      const _6 = ".cc-1wyxr0k{padding-left:4px}";
      const _5 = ".cc-1wyxr0k{padding-bottom:4px}";
      const _4 = ".cc-1wyxr0k{padding-right:4px}";
      const _3 = ".cc-1wyxr0k{padding-top:4px}";
      const _2 =
        "@media (min-width:768px){.cc-ysa2s9{width:50%}.cc-ysa2s9 .inner{padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px}}";
      const _ = ".cc-ysa2s9{width:100%}";
      const styles = {
        layoutStyles: "cc-ysa2s9",
        compactStyles: "cc-1wyxr0k",
      };
      const C = ({ isCompact }) => (
        <CC>
          <CS>{[_, _2, _3, _4, _5, _6, _7]}</CS>
          {
            <div
              className={ax([styles.layoutStyles, isCompact && styles.compactStyles])}
            />
          }
        </CC>
      );
      "
    `);
  });

  it('should handle CSS custom properties (CSS variables) in non-atomic variants', () => {
    // CSS variables (--custom-prop) are first-class declarations in non-atomic mode.
    // They are emitted as regular declarations inside the cc- class, just like any other property.
    // Consumers can then override them by applying a different variant.
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        panelStyles: {
          '--panel-bg': 'blue',
          '--panel-gap': '8px',
          backgroundColor: 'var(--panel-bg)',
          gap: 'var(--panel-gap)',
        },
        dangerStyles: {
          '--panel-bg': 'pink',
          backgroundColor: 'var(--panel-bg)',
        },
      }, { atomic: false });
      const C = ({ isDanger }) => <div css={[styles.panelStyles, isDanger && styles.dangerStyles]} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _6 = ".cc-oljnhh{background-color:var(--panel-bg)}";
      const _5 = ".cc-oljnhh{--panel-bg:pink}";
      const _4 = ".cc-2ax5o6{gap:var(--panel-gap)}";
      const _3 = ".cc-2ax5o6{background-color:var(--panel-bg)}";
      const _2 = ".cc-2ax5o6{--panel-gap:8px}";
      const _ = ".cc-2ax5o6{--panel-bg:blue}";
      const styles = {
        panelStyles: "cc-2ax5o6",
        dangerStyles: "cc-oljnhh",
      };
      const C = ({ isDanger }) => (
        <CC>
          <CS>{[_, _2, _3, _4, _5, _6]}</CS>
          {
            <div
              className={ax([styles.panelStyles, isDanger && styles.dangerStyles])}
            />
          }
        </CC>
      );
      "
    `);
  });

  it('should handle @property at-rule in non-atomic variants', () => {
    // @property is a special CSS at-rule for registering custom properties with a type,
    // initial value and inheritance flag. In non-atomic mode the declarations inside
    // @property are scoped under the cc- class (note: @property is technically a global
    // rule so the scoping here is a Compiled convention rather than native CSS behaviour).
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        gradientStyles: {
          '@property --panel-gradient-angle': {
            syntax: "'<angle>'",
            initialValue: '270deg',
            inherits: 'false',
          },
          '--panel-gradient-angle': '270deg',
          background: 'linear-gradient(var(--panel-gradient-angle), blue, pink)',
        },
      }, { atomic: false });
      const C = () => <div css={styles.gradientStyles} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _3 =
        ".cc-id7xhj{background:linear-gradient(var(--panel-gradient-angle),blue,pink)}";
      const _2 = ".cc-id7xhj{--panel-gradient-angle:270deg}";
      const _ =
        "@property --panel-gradient-angle{syntax:'<angle>';initial-value:270deg;inherits:false}";
      const styles = {
        gradientStyles: "cc-id7xhj",
      };
      const C = () => (
        <CC>
          <CS>{[_, _2, _3]}</CS>
          {<div className={ax([styles.gradientStyles])} />}
        </CC>
      );
      "
    `);
  });

  it('should handle keyframes() reference in an atomic cssMap variant (comparison baseline)', () => {
    // This test documents the CORRECT atomic behaviour for @keyframes:
    // - @keyframes stops (0%, to) have NO class selector prefix
    // - Only the animation property declarations get the atomic _ class
    // The non-atomic test below should match this behaviour for @keyframes stops.
    const actual = transformPretty(
      `
      import { cssMap, keyframes } from '@compiled/react';
      const spin = keyframes({ from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } });
      const styles = cssMap({
        animated: {
          '.spinner': {
            animationName: spin,
            animationDuration: '2s',
          },
        },
        static: { opacity: 1 },
      });
      const C = ({ isAnimated }) => <div css={[styles.static, isAnimated && styles.animated]} />;
    `,
      { pretty: true }
    );

    // Key assertion: @keyframes stops have NO class selector prefix
    expect(actual).toContain(
      '@keyframes k7rupus{0%{transform:rotate(0deg)}to{transform:rotate(360deg)}}'
    );
    // Animation declarations get the atomic _ class
    expect(actual).toContain('.spinner{animation-name:k7rupus');
  });

  it('should handle keyframes() reference and @keyframes inline in a non-atomic variant', () => {
    // keyframes() from @compiled/react can be used as a value inside cssMap —
    // the Babel plugin resolves it to a stable hash string at compile time.
    // In non-atomic mode, the @keyframes rule and animation declarations are
    // combined into a single CSS string so they all share ONE cc- class name.
    // @keyframes stops (0%, to) must NOT be prefixed with the cc- class —
    // they are keyframe selectors, not element selectors. Only animation property
    // declarations and child element selectors get the cc- class prefix.
    const actual = transformPretty(
      `
      import { cssMap, keyframes } from '@compiled/react';
      const spin = keyframes({ from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } });
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        animated: {
          '.spinner': {
            animationName: spin,
            animationDuration: '2s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          },
        },
        static: { opacity: 1 },
      }, { atomic: false });
      const C = ({ isAnimated }) => <div css={[styles.static, isAnimated && styles.animated]} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _3 = ".cc-zs6pa2{opacity:1}";
      const _2 =
        ".cc-zs9m2x .spinner{animation-name:k7rupus;animation-duration:2s;animation-timing-function:linear;animation-iteration-count:infinite}";
      const _ =
        "@keyframes k7rupus{0%{transform:rotate(0deg)}to{transform:rotate(360deg)}}";
      const spin = null;
      const styles = {
        animated: "cc-zs9m2x",
        static: "cc-zs6pa2",
      };
      const C = ({ isAnimated }) => (
        <CC>
          <CS>{[_, _2, _3]}</CS>
          {<div className={ax([styles.static, isAnimated && styles.animated])} />}
        </CC>
      );
      "
    `);
  });

  it('should handle @supports in a non-atomic variant', () => {
    // @supports is used in the editor for progressive enhancement / legacy fallbacks.
    // In non-atomic mode it is treated like any other at-rule — wrapped and scoped
    // under the single cc- class for the variant.
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        legacyStyles: {
          display: 'block',
          '@supports not (display: flow-root)': {
            '.panel::after': {
              content: '',
              display: 'table',
              clear: 'both',
            },
          },
        },
      }, { atomic: false });
      const C = () => <div css={styles.legacyStyles} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 =
        '@supports not (display:flow-root){.cc-k2kv27 .panel:after{content:"";display:table;clear:both}}';
      const _ = ".cc-k2kv27{display:block}";
      const styles = {
        legacyStyles: "cc-k2kv27",
      };
      const C = () => (
        <CC>
          <CS>{[_, _2]}</CS>
          {<div className={ax([styles.legacyStyles])} />}
        </CC>
      );
      "
    `);
  });

  it('should handle @container queries (literal) in a non-atomic variant', () => {
    // @container queries are used extensively in the editor for responsive layout.
    // They are treated like @media rules — wrapped under the cc- class.
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        responsiveStyles: {
          padding: '16px',
          '@container editor-area (max-width: 600px)': {
            '.panel': { padding: '8px' },
          },
        },
      }, { atomic: false });
      const C = () => <div css={styles.responsiveStyles} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _5 =
        "@container editor-area (max-width: 600px){.cc-197u3x4 .panel{padding-top:8px;padding-right:8px;padding-bottom:8px;padding-left:8px}}";
      const _4 = ".cc-197u3x4{padding-left:16px}";
      const _3 = ".cc-197u3x4{padding-bottom:16px}";
      const _2 = ".cc-197u3x4{padding-right:16px}";
      const _ = ".cc-197u3x4{padding-top:16px}";
      const styles = {
        responsiveStyles: "cc-197u3x4",
      };
      const C = () => (
        <CC>
          <CS>{[_, _2, _3, _4, _5]}</CS>
          {<div className={ax([styles.responsiveStyles])} />}
        </CC>
      );
      "
    `);
  });

  it('should handle computed at-rule key (variable reference) in a non-atomic variant', () => {
    // The editor defines container query strings as constants and uses them as
    // computed property keys: [editorAreaNarrowPageContainerQuery]: { ... }
    // Compiled resolves the variable binding at compile time.
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      const containerQuery = '@container editor-area (max-width: 760px)';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        responsiveStyles: {
          [containerQuery]: {
            '.panel': { padding: '8px' },
          },
        },
      }, { atomic: false });
      const C = () => <div css={styles.responsiveStyles} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ =
        "@container editor-area (max-width: 760px){.cc-197u3x4 .panel{padding-top:8px;padding-right:8px;padding-bottom:8px;padding-left:8px}}";
      const containerQuery = "@container editor-area (max-width: 760px)";
      const styles = {
        responsiveStyles: "cc-197u3x4",
      };
      const C = () => (
        <CC>
          <CS>{[_]}</CS>
          {<div className={ax([styles.responsiveStyles])} />}
        </CC>
      );
      "
    `);
  });

  it('should handle spread of external style object in a non-atomic variant', () => {
    // The editor spreads shared style objects (e.g. ...dangerBorderStyles) inside
    // cssMap variants using // eslint-disable no-unsafe-values suppression.
    // Compiled resolves the binding at compile time and inlines the declarations.
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      const dangerBorderStyles = { boxShadow: '0 0 0 1px red', borderColor: 'red' };
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        dangerStyles: {
          '.panel': {
            // eslint-disable-next-line @atlaskit/ui-styling-standard/no-unsafe-values
            ...dangerBorderStyles,
            padding: '8px',
          },
        },
      }, { atomic: false });
      const C = () => <div css={styles.dangerStyles} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ =
        ".cc-oljnhh .panel{box-shadow:0 0 0 1px red;border-color:red;padding-top:8px;padding-right:8px;padding-bottom:8px;padding-left:8px}";
      const dangerBorderStyles = {
        boxShadow: "0 0 0 1px red",
        borderColor: "red",
      };
      const styles = {
        dangerStyles: "cc-oljnhh",
      };
      const C = () => (
        <CC>
          <CS>{[_]}</CS>
          {<div className={ax([styles.dangerStyles])} />}
        </CC>
      );
      "
    `);
  });

  it('should handle !important declarations in a non-atomic variant', () => {
    // The editor uses !important overrides in some cases (e.g. backgroundColor overrides).
    // In non-atomic mode !important is preserved as-is in the output CSS.
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        overrideStyles: {
          '.panel': {
            // eslint-disable-next-line @atlaskit/ui-styling-standard/no-important-styles
            backgroundColor: 'blue !important',
            borderColor: 'blue',
          },
        },
      }, { atomic: false });
      const C = () => <div css={styles.overrideStyles} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ =
        ".cc-148sxnx .panel{background-color:blue!important;border-color:blue}";
      const styles = {
        overrideStyles: "cc-148sxnx",
      };
      const C = () => (
        <CC>
          <CS>{[_]}</CS>
          {<div className={ax([styles.overrideStyles])} />}
        </CC>
      );
      "
    `);
  });

  it('should support the real-world editor pattern: always-on + fg() boolean + ternary + compound condition', () => {
    // Mirrors the actual usage pattern in EditorContentContainer-compiled.tsx:
    //   css={[
    //     styles.baseStyles,                                 ← always on
    //     isFullPage && styles.fullPageStyles,               ← fg() / boolean gate
    //     fg_typography_ugc                                  ← ternary between two variants
    //       ? styles.typographyUGC
    //       : styles.typographyDefault,
    //     isFullPage && isDense && styles.denseStyles,       ← compound boolean condition
    //     isFirefox && styles.firefoxStyles,                 ← browser detection gate
    //   ]}
    const actual = transformPretty(
      `
      import { cssMap } from '@compiled/react';
      // @ts-expect-error -- atomic is an internal option, not part of the public API
      const styles = cssMap({
        baseStyles: { color: 'red', padding: '8px' },
        fullPageStyles: { maxWidth: '1200px' },
        typographyUGC: { fontFamily: 'sans-serif' },
        typographyDefault: { fontFamily: 'serif' },
        denseStyles: { lineHeight: 1.2 },
        firefoxStyles: { scrollbarWidth: 'thin' },
      }, { atomic: false });

      const EditorContainer = ({ isFullPage, isFirefox, isDense, fg_typography_ugc }) => (
        <div css={[
          styles.baseStyles,
          isFullPage && styles.fullPageStyles,
          fg_typography_ugc
            ? styles.typographyUGC
            : styles.typographyDefault,
          isFullPage && isDense && styles.denseStyles,
          isFirefox && styles.firefoxStyles,
        ]} />
      );
    `,
      { pretty: true }
    );

    // Key properties of the non-atomic output:
    // 1. All variant CSS sheets are hoisted at compile time (no runtime CSS generation)
    // 2. Each variant is one opaque "cc-" class — never "_" prefixed
    // 3. ax() receives the class strings directly; non-"_" classes pass through as-is
    // 4. Ternary between variants compiles to a JS ternary selecting between two cc- strings
    // 5. Compound && conditions are preserved as-is in the className expression
    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _0 = ".cc-cuh1m4{scrollbar-width:thin}";
      const _9 = ".cc-1n67tsr{line-height:1.2}";
      const _8 = ".cc-15lej18{font-family:serif}";
      const _7 = ".cc-gv27a7{font-family:sans-serif}";
      const _6 = ".cc-h2ubxs{max-width:1200px}";
      const _5 = ".cc-2qfkyd{padding-left:8px}";
      const _4 = ".cc-2qfkyd{padding-bottom:8px}";
      const _3 = ".cc-2qfkyd{padding-right:8px}";
      const _2 = ".cc-2qfkyd{padding-top:8px}";
      const _ = ".cc-2qfkyd{color:red}";
      const styles = {
        baseStyles: "cc-2qfkyd",
        fullPageStyles: "cc-h2ubxs",
        typographyUGC: "cc-gv27a7",
        typographyDefault: "cc-15lej18",
        denseStyles: "cc-1n67tsr",
        firefoxStyles: "cc-cuh1m4",
      };
      const EditorContainer = ({
        isFullPage,
        isFirefox,
        isDense,
        fg_typography_ugc,
      }) => (
        <CC>
          <CS>{[_, _2, _3, _4, _5, _6, _7, _8, _9, _0]}</CS>
          {
            <div
              className={ax([
                styles.baseStyles,
                isFullPage && styles.fullPageStyles,
                fg_typography_ugc ? styles.typographyUGC : styles.typographyDefault,
                isFullPage && isDense && styles.denseStyles,
                isFirefox && styles.firefoxStyles,
              ])}
            />
          }
        </CC>
      );
      "
    `);
  });

  it('should error out if options contain a spread element', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const opts = { atomic: false };
        const styles = cssMap(${styles}, { ...opts });
      `);
    }).toThrow(ErrorMessages.OPTS_PROPERTY_TYPE);
  });

  it('should error out if options contain an object method', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap(${styles}, { atomic() { return false; } });
      `);
    }).toThrow(ErrorMessages.OPTS_PROPERTY_TYPE);
  });

  it('should error out if options contain a computed property key', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap(${styles}, { ['atomic']: false });
      `);
    }).toThrow(ErrorMessages.OPTS_PROPERTY_TYPE);
  });

  it('should error out if options contain an unknown property name', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap(${styles}, { unknownOption: false });
      `);
    }).toThrow(ErrorMessages.OPTS_PROPERTY_KNOWN_NAME);
  });

  it('should error out if atomic option value is not a boolean literal', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap(${styles}, { atomic: 'false' });
      `);
    }).toThrow(ErrorMessages.OPTS_PROPERTY_VALUE_TYPE);
  });

  it('should error out if atomic option value is not a literal (variable)', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const isAtomic = false;
        const styles = cssMap(${styles}, { atomic: isAtomic });
      `);
    }).toThrow(ErrorMessages.OPTS_PROPERTY_VALUE_TYPE);
  });
});
