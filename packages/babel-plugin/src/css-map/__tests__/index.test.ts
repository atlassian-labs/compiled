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
      import { cssMap, cssMapScoped } from '@compiled/react';

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
      import { cssMap, cssMapScoped } from '@compiled/react';

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
      import { cssMap, cssMapScoped } from '@compiled/react';

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
      import { cssMap, cssMapScoped } from '@compiled/react';

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
      import { cssMap, cssMapScoped } from '@compiled/react';

      const styles = cssMap({ root: { color: 'red' } });

      // Eg. we expect 'styles.root' here instead of 'styles'
      <div css={styles} />
    `);
    }).toThrow(ErrorMessages.USE_VARIANT_OF_CSS_MAP);

    expect(() => {
      transform(`
      import { cssMap, cssMapScoped } from '@compiled/react';

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
      import { cssMap, cssMapScoped } from '@compiled/react';

      const styles = {
        map1: cssMap(${styles}),
      }
    `);
    }).toThrow(ErrorMessages.DEFINE_MAP);

    expect(() => {
      transform(`
      import { cssMap, cssMapScoped } from '@compiled/react';

      const styles = () => cssMap(${styles})
    `);
    }).toThrow(ErrorMessages.DEFINE_MAP);
  });

  it('should error out if cssMap receives more than two arguments', () => {
    expect(() => {
      transform(`
        import { cssMap, cssMapScoped } from '@compiled/react';

        const styles = cssMap(${styles}, ${styles}, {})
      `);
    }).toThrow(`cssMap ${ErrorMessages.NUMBER_OF_ARGUMENT}`);
  });

  it('should error out if cssMap does not receive an object', () => {
    expect(() => {
      transform(`
        import { cssMap, cssMapScoped } from '@compiled/react';

        const styles = cssMap('color: red')
      `);
    }).toThrow('cssMap ' + ErrorMessages.ARGUMENT_TYPE);
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

  it('should error out if cssMap receives more than one argument', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap(${styles}, { someOption: true });
      `);
    }).toThrow(`cssMap ${ErrorMessages.NUMBER_OF_ARGUMENT}`);
  });

  it('should error out if cssMapScoped receives more than one argument', () => {
    expect(() => {
      transform(`
        import { cssMapScoped } from '@compiled/react';

        // @ts-expect-error -- cssMapScoped is not in public types
        const styles = cssMapScoped(${styles}, { someOption: true });
      `);
    }).toThrow(`cssMapScoped ${ErrorMessages.NUMBER_OF_ARGUMENT}`);
  });
});

describe('css map — cssMapScoped (non-atomic)', () => {
  // Class names are derived from hash(relative(filename) + ':' + variableName + ':' + variantKey)
  // — stable and deterministic across CI and local, mirroring the CSS Modules approach.
  const transformPretty = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: true, ...opts });

  it('should allow two cssMapScoped calls with same key to be composed, with CSS source order determining the winner', () => {
    // Two cssMapScoped calls in the same file with the same variant key name produce
    // DIFFERENT cc- classes (hash includes variableName + variantKey, like CSS Modules).
    // When applied together in a css array, both classes are applied to the element.
    // CSS source order determines which declarations win for overlapping properties —
    // the sheet defined later in the file is injected later and wins.
    const actual = transformPretty(
      `
      import { cssMapScoped } from '@compiled/react';

      // Defined in "component-a.tsx" — base panel styles
      const baseStyles = cssMapScoped({
        panel: { color: 'blue', padding: '8px' },
      });

      // Defined in "component-b.tsx" — override panel styles, same key name
      const overrideStyles = cssMapScoped({
        panel: { color: 'red' },
      });

      // Applying both: overrideStyles.panel is applied AFTER baseStyles.panel in the array.
      // Both resolve to DIFFERENT cc- classes (different variableName in the hash).
      // Both classes are applied — CSS source order determines which wins for 'color'.
      const C = () => <div css={[baseStyles.panel, overrideStyles.panel]} />;
    `
    );

    // baseStyles.panel  → hash('<test-file>:baseStyles:panel')  → cc-uxz9ww
    // overrideStyles.panel → hash('<test-file>:overrideStyles:panel') → cc-16myskf
    // Different variableNames → different cc- classes → both applied: class="cc-uxz9ww cc-16myskf"
    // overrideStyles sheet is injected AFTER baseStyles sheet → color:red wins via CSS source order.
    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = ".cc-16myskf{color:red}";
      const _ =
        ".cc-uxz9ww{color:blue}.cc-uxz9ww{padding-top:8px}.cc-uxz9ww{padding-right:8px}.cc-uxz9ww{padding-bottom:8px}.cc-uxz9ww{padding-left:8px}";
      const baseStyles = {
        panel: "cc-uxz9ww",
      };
      const overrideStyles = {
        panel: "cc-16myskf",
      };
      const C = () => (
        <CC>
          <CS>{[_, _2]}</CS>
          {<div className={ax([baseStyles.panel, overrideStyles.panel])} />}
        </CC>
      );
      "
    `);
  });

  it('should require a nested selector on the parent to win specificity over child styles', () => {
    // This test documents the cross-component override pattern:
    // - A child component (Editor) uses cssMapScoped with key 'panel' → cc-xxx
    // - A parent component (Confluence) wants to override '.panel' styles
    // - If Confluence uses the same variant key 'panel', it gets the SAME cc- class
    //   and cannot override (same specificity, source order determines winner)
    // - To reliably override, Confluence must use a DIFFERENT variant key with a
    //   nested selector that wraps the editor's class → higher specificity wins
    const actual = transformPretty(
      `
      import { cssMapScoped } from '@compiled/react';

      // Editor component styles (child) — key 'panel'
      const editorStyles = cssMapScoped({
        panel: {
          '.panel': { color: 'blue', backgroundColor: 'white' },
        },
      });

      // Confluence wrapper styles (parent) — uses a DIFFERENT key with nested selector
      // to achieve higher specificity: .cc-confluencePanel .cc-editorPanel .panel
      const confluenceStyles = cssMapScoped({
        // Different key name → different cc- class → can be used as a scope wrapper
        confluencePanel: {
          // Nest the editor's cc- class inside to get higher specificity:
          // .cc-hz6e4 .cc-1jd78t .panel { (0,3,0) } wins over .cc-1jd78t .panel { (0,2,0) }
          '.cc-1jd78t .panel': { backgroundColor: 'pink' },
        },
      });

      // HTML: <div class="cc-hz6e4"><div class="cc-1jd78t"><div class="panel"/></div></div>
      // .cc-hz6e4 .cc-1jd78t .panel { specificity: (0,3,0) } wins over
      // .cc-1jd78t .panel { specificity: (0,2,0) }
      const Page = () => (
        <div css={confluenceStyles.confluencePanel}>
          <div css={editorStyles.panel}>
            <div className="panel" />
          </div>
        </div>
      );
    `
    );

    // confluencePanel → cc-hz6e4 (different variableName + key → different class than editorStyles.panel)
    // The nested '.cc-hz6e4 .cc-1jd78t .panel' selector (0,3,0) wins over '.cc-1jd78t .panel' (0,2,0)
    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = ".cc-5uruqn .panel{color:blue;background-color:white}";
      const _ = ".cc-hz6e4 .cc-1jd78t .panel{background-color:pink}";
      const editorStyles = {
        panel: "cc-5uruqn",
      };
      const confluenceStyles = {
        confluencePanel: "cc-hz6e4",
      };
      const Page = () => (
        <CC>
          <CS>{[_]}</CS>
          {
            <div className={ax([confluenceStyles.confluencePanel])}>
              <CC>
                <CS>{[_2]}</CS>
                {
                  <div className={ax([editorStyles.panel])}>
                    <div className="panel" />
                  </div>
                }
              </CC>
            </div>
          }
        </CC>
      );
      "
    `);
  });

  it('should produce one non-atomic cc- class per variant instead of multiple atomic _ classes', () => {
    // Each variant emits exactly ONE class with a "cc-" prefix (no "_" prefix).
    // No "_" prefix means ax() treats it as an opaque plain string, not an atomic group.
    // Different variants → different class names (different variant keys → different hashes).
    const actual = transformPretty(`
      import { cssMap, cssMapScoped } from '@compiled/react';

      const styles = cssMapScoped({
        danger: {
            color: 'red',
            backgroundColor: 'red'
        },
        success: {
          color: 'green',
          backgroundColor: 'green'
        }
      });

      const Component = () => <div>
        <span css={styles.danger} />
        <span css={styles.success} />
      </div>
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = ".cc-1b3vuyx{color:green}.cc-1b3vuyx{background-color:green}";
      const _ = ".cc-s5fhfj{color:red}.cc-s5fhfj{background-color:red}";
      const styles = {
        danger: "cc-s5fhfj",
        success: "cc-1b3vuyx",
      };
      const Component = () => (
        <div>
          <CC>
            <CS>{[_, _2]}</CS>
            {<span className={ax([styles.danger])} />}
          </CC>
          <CC>
            <CS>{[_, _2]}</CS>
            {<span className={ax([styles.success])} />}
          </CC>
        </div>
      );
      "
    `);
  });

  it('should scope pseudo-selectors under the single non-atomic class', () => {
    const actual = transformPretty(
      `
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
        danger: { color: 'red', '&:hover': { color: 'darkred' } },
        success: { color: 'green' },
      });
      const C = () => <div css={styles.danger} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = ".cc-1b3vuyx{color:green}";
      const _ = ".cc-s5fhfj{color:red}.cc-s5fhfj:hover{color:darkred}";
      const styles = {
        danger: "cc-s5fhfj",
        success: "cc-1b3vuyx",
      };
      const C = () => (
        <CC>
          <CS>{[_, _2]}</CS>
          {<div className={ax([styles.danger])} />}
        </CC>
      );
      "
    `);
  });

  it('should preserve and correctly scope at-rules under the single non-atomic class', () => {
    const actual = transformPretty(
      `
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
        root: {
          color: 'red',
          '@media (min-width: 768px)': { color: 'blue' },
        },
      });
      const C = () => <div css={styles.root} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ =
        ".cc-1kkgg11{color:red}@media (min-width:768px){.cc-1kkgg11{color:blue}}";
      const styles = {
        root: "cc-1kkgg11",
      };
      const C = () => (
        <CC>
          <CS>{[_]}</CS>
          {<div className={ax([styles.root])} />}
        </CC>
      );
      "
    `);
  });

  it('should produce an empty string class name for an empty variant', () => {
    const actual = transformPretty(
      `
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
        empty: {},
        solid: { color: 'red' },
      });
      const C = () => <div css={styles.solid} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = ".cc-1agguk9{color:red}";
      const styles = {
        empty: "cc-1u1bciy",
        solid: "cc-1agguk9",
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
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
        danger: { color: 'red', backgroundColor: 'pink' },
        success: { color: 'green', backgroundColor: 'lightgreen' },
      });
      const C = ({ variant }) => <div css={styles[variant]} />;
    `,
      { pretty: true }
    );

    // All variant sheets are hoisted. The single non-atomic class for the selected
    // variant is resolved at runtime via styles[variant].
    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = ".cc-1b3vuyx{color:green}.cc-1b3vuyx{background-color:lightgreen}";
      const _ = ".cc-s5fhfj{color:red}.cc-s5fhfj{background-color:pink}";
      const styles = {
        danger: "cc-s5fhfj",
        success: "cc-1b3vuyx",
      };
      const C = ({ variant }) => (
        <CC>
          <CS>{[_, _2]}</CS>
          {<div className={ax([styles[variant]])} />}
        </CC>
      );
      "
    `);
  });

  it('should support conditional variant application via logical &&', () => {
    const actual = transformPretty(
      `
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
        danger: { color: 'red' },
        success: { color: 'green' },
      });
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
      const _2 = ".cc-1b3vuyx{color:green}";
      const _ = ".cc-s5fhfj{color:red}";
      const styles = {
        danger: "cc-s5fhfj",
        success: "cc-1b3vuyx",
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
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
        base: { color: 'red', padding: '8px' },
        selected: { backgroundColor: 'blue' },
        disabled: { opacity: 0.5 },
      });
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
      const _3 = ".cc-1nivfq0{opacity:0.5}";
      const _2 = ".cc-16e824i{background-color:blue}";
      const _ =
        ".cc-bhu58x{color:red}.cc-bhu58x{padding-top:8px}.cc-bhu58x{padding-right:8px}.cc-bhu58x{padding-bottom:8px}.cc-bhu58x{padding-left:8px}";
      const styles = {
        base: "cc-bhu58x",
        selected: "cc-16e824i",
        disabled: "cc-1nivfq0",
      };
      const C = ({ isSelected, isDisabled }) => (
        <CC>
          <CS>{[_, _2, _3]}</CS>
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
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
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
      });
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
      const _2 =
        ".cc-1nl3kcl .panel{background-color:pink}.cc-1nl3kcl .panel-title{color:red}";
      const _ =
        ".cc-1ves40c .panel{padding-top:8px;padding-right:8px;padding-bottom:8px;padding-left:8px;background-color:blue}.cc-1ves40c .panel-title{font-weight:bold;color:blue}.cc-1ves40c .panel-icon{width:24px;height:24px}.cc-1ves40c .panel-icon svg{fill:currentColor}";
      const styles = {
        panelStyles: "cc-1ves40c",
        dangerStyles: "cc-1nl3kcl",
      };
      const C = ({ isDanger }) => (
        <CC>
          <CS>{[_, _2]}</CS>
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
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
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
      });
      const C = ({ isCompact }) => <div css={[styles.layoutStyles, isCompact && styles.compactStyles]} />;
    `,
      { pretty: true }
    );

    // Nested selectors inside @media are output as @media { .cc-xxx .inner { ... } }
    // — both the at-rule and the inner selector are correctly scoped.
    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 =
        ".cc-1anag6b{padding-top:4px}.cc-1anag6b{padding-right:4px}.cc-1anag6b{padding-bottom:4px}.cc-1anag6b{padding-left:4px}@media (min-width:768px){.cc-1anag6b{padding-top:8px}.cc-1anag6b{padding-right:8px}.cc-1anag6b{padding-bottom:8px}.cc-1anag6b{padding-left:8px}}";
      const _ =
        ".cc-1av4b68{width:100%}@media (min-width:768px){.cc-1av4b68{width:50%}.cc-1av4b68 .inner{padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px}}";
      const styles = {
        layoutStyles: "cc-1av4b68",
        compactStyles: "cc-1anag6b",
      };
      const C = ({ isCompact }) => (
        <CC>
          <CS>{[_, _2]}</CS>
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
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
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
      });
      const C = ({ isDanger }) => <div css={[styles.panelStyles, isDanger && styles.dangerStyles]} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 =
        ".cc-1nl3kcl{--panel-bg:pink}.cc-1nl3kcl{background-color:var(--panel-bg)}";
      const _ =
        ".cc-1ves40c{--panel-bg:blue}.cc-1ves40c{--panel-gap:8px}.cc-1ves40c{background-color:var(--panel-bg)}.cc-1ves40c{gap:var(--panel-gap)}";
      const styles = {
        panelStyles: "cc-1ves40c",
        dangerStyles: "cc-1nl3kcl",
      };
      const C = ({ isDanger }) => (
        <CC>
          <CS>{[_, _2]}</CS>
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
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
        gradientStyles: {
          '@property --panel-gradient-angle': {
            syntax: "'<angle>'",
            initialValue: '270deg',
            inherits: 'false',
          },
          '--panel-gradient-angle': '270deg',
          background: 'linear-gradient(var(--panel-gradient-angle), blue, pink)',
        },
      });
      const C = () => <div css={styles.gradientStyles} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ =
        "@property --panel-gradient-angle{syntax:'<angle>';initial-value:270deg;inherits:false}.cc-1uqlgeg{--panel-gradient-angle:270deg}.cc-1uqlgeg{background:linear-gradient(var(--panel-gradient-angle),blue,pink)}";
      const styles = {
        gradientStyles: "cc-1uqlgeg",
      };
      const C = () => (
        <CC>
          <CS>{[_]}</CS>
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
      import { cssMapScoped, keyframes } from '@compiled/react';
      const spin = keyframes({ from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } });
      const styles = cssMapScoped({
        animated: {
          '.spinner': {
            animationName: spin,
            animationDuration: '2s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          },
        },
        static: { opacity: 1 },
      });
      const C = ({ isAnimated }) => <div css={[styles.static, isAnimated && styles.animated]} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = ".cc-1l86m2j{opacity:1}";
      const _ =
        "@keyframes k7rupus{0%{transform:rotate(0deg)}to{transform:rotate(360deg)}}.cc-1d3dj3b .spinner{animation-name:k7rupus;animation-duration:2s;animation-timing-function:linear;animation-iteration-count:infinite}";
      const spin = null;
      const styles = {
        animated: "cc-1d3dj3b",
        static: "cc-1l86m2j",
      };
      const C = ({ isAnimated }) => (
        <CC>
          <CS>{[_, _2]}</CS>
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
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
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
      });
      const C = () => <div css={styles.legacyStyles} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ =
        '.cc-1o3m7nc{display:block}@supports not (display:flow-root){.cc-1o3m7nc .panel:after{content:"";display:table;clear:both}}';
      const styles = {
        legacyStyles: "cc-1o3m7nc",
      };
      const C = () => (
        <CC>
          <CS>{[_]}</CS>
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
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
        responsiveStyles: {
          padding: '16px',
          '@container editor-area (max-width: 600px)': {
            '.panel': { padding: '8px' },
          },
        },
      });
      const C = () => <div css={styles.responsiveStyles} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ =
        ".cc-1xtbrag{padding-top:16px}.cc-1xtbrag{padding-right:16px}.cc-1xtbrag{padding-bottom:16px}.cc-1xtbrag{padding-left:16px}@container editor-area (max-width: 600px){.cc-1xtbrag .panel{padding-top:8px;padding-right:8px;padding-bottom:8px;padding-left:8px}}";
      const styles = {
        responsiveStyles: "cc-1xtbrag",
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

  it('should handle computed at-rule key (variable reference) in a non-atomic variant', () => {
    // The editor defines container query strings as constants and uses them as
    // computed property keys: [editorAreaNarrowPageContainerQuery]: { ... }
    // Compiled resolves the variable binding at compile time.
    const actual = transformPretty(
      `
      import { cssMap, cssMapScoped } from '@compiled/react';
      const containerQuery = '@container editor-area (max-width: 760px)';
      const styles = cssMapScoped({
        responsiveStyles: {
          [containerQuery]: {
            '.panel': { padding: '8px' },
          },
        },
      });
      const C = () => <div css={styles.responsiveStyles} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ =
        "@container editor-area (max-width: 760px){.cc-1xtbrag .panel{padding-top:8px;padding-right:8px;padding-bottom:8px;padding-left:8px}}";
      const containerQuery = "@container editor-area (max-width: 760px)";
      const styles = {
        responsiveStyles: "cc-1xtbrag",
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
      import { cssMap, cssMapScoped } from '@compiled/react';
      const dangerBorderStyles = { boxShadow: '0 0 0 1px red', borderColor: 'red' };
      const styles = cssMapScoped({
        dangerStyles: {
          '.panel': {
            // eslint-disable-next-line @atlaskit/ui-styling-standard/no-unsafe-values
            ...dangerBorderStyles,
            padding: '8px',
          },
        },
      });
      const C = () => <div css={styles.dangerStyles} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ =
        ".cc-1nl3kcl .panel{box-shadow:0 0 0 1px red;border-color:red;padding-top:8px;padding-right:8px;padding-bottom:8px;padding-left:8px}";
      const dangerBorderStyles = {
        boxShadow: "0 0 0 1px red",
        borderColor: "red",
      };
      const styles = {
        dangerStyles: "cc-1nl3kcl",
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
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
        overrideStyles: {
          '.panel': {
            // eslint-disable-next-line @atlaskit/ui-styling-standard/no-important-styles
            backgroundColor: 'blue !important',
            borderColor: 'blue',
          },
        },
      });
      const C = () => <div css={styles.overrideStyles} />;
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ =
        ".cc-122hb2a .panel{background-color:blue!important;border-color:blue}";
      const styles = {
        overrideStyles: "cc-122hb2a",
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
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
        baseStyles: { color: 'red', padding: '8px' },
        fullPageStyles: { maxWidth: '1200px' },
        typographyUGC: { fontFamily: 'sans-serif' },
        typographyDefault: { fontFamily: 'serif' },
        denseStyles: { lineHeight: 1.2 },
        firefoxStyles: { scrollbarWidth: 'thin' },
      });

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
      const _6 = ".cc-1sbd89o{scrollbar-width:thin}";
      const _5 = ".cc-4pkegl{line-height:1.2}";
      const _4 = ".cc-iuccxl{font-family:serif}";
      const _3 = ".cc-tcjkhn{font-family:sans-serif}";
      const _2 = ".cc-mzzh5b{max-width:1200px}";
      const _ =
        ".cc-oxxe21{color:red}.cc-oxxe21{padding-top:8px}.cc-oxxe21{padding-right:8px}.cc-oxxe21{padding-bottom:8px}.cc-oxxe21{padding-left:8px}";
      const styles = {
        baseStyles: "cc-oxxe21",
        fullPageStyles: "cc-mzzh5b",
        typographyUGC: "cc-tcjkhn",
        typographyDefault: "cc-iuccxl",
        denseStyles: "cc-4pkegl",
        firefoxStyles: "cc-1sbd89o",
      };
      const EditorContainer = ({
        isFullPage,
        isFirefox,
        isDense,
        fg_typography_ugc,
      }) => (
        <CC>
          <CS>{[_, _2, _3, _4, _5, _6]}</CS>
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

  it('should inject shared multi-selector sheet BEFORE individual override sheets — annotation styles cascade pattern (simple & selector)', () => {
    // This is the critical editor annotation styles pattern:
    // A shared base rule (border-bottom shorthand) must appear as the FIRST sheet
    // in the CS array so that individual override rules (border-bottom-color) injected
    // after it correctly win in CSS cascade.
    // The shared rule uses a computed multi-selector key: ['&.blur, &.focus, &.draft, &.hover']
    const actual = transformPretty(
      `
      import { cssMap, cssMapScoped } from '@compiled/react';
      const styles = cssMapScoped({
        annotationStyles: {
          ['&.blur, &.focus, &.draft, &.hover']: {
            borderBottom: '2px solid transparent',
            cursor: 'pointer',
          },
          '&.focus': { background: 'yellow', borderBottomColor: 'orange' },
          '&.draft': { background: 'gold', borderBottomColor: 'orange', cursor: 'auto' },
          '&.blur': { background: 'lightyellow', borderBottomColor: 'orange' },
          '&.hover': { background: 'gold', borderBottomColor: 'orange' },
        },
      });
      const C = () => <div css={styles.annotationStyles} />;
    `,
      { pretty: true }
    );

    // The shared multi-selector rule (.blur,.focus,.draft,.hover) must be the FIRST
    // sheet variable (lowest index, injected first = base styles).
    // Individual override rules (.focus, .draft, .blur, .hover with border-bottom-color)
    // must come AFTER so they win in cascade.
    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ =
        ".cc-sc6vuo.blur,.cc-sc6vuo.draft,.cc-sc6vuo.focus,.cc-sc6vuo.hover{border-bottom:2px solid transparent;cursor:pointer}.cc-sc6vuo.focus{background-color:yellow;border-bottom-color:orange}.cc-sc6vuo.draft{background-color:gold;border-bottom-color:orange;cursor:auto}.cc-sc6vuo.blur{background-color:lightyellow;border-bottom-color:orange}.cc-sc6vuo.hover{background-color:gold;border-bottom-color:orange}";
      const styles = {
        annotationStyles: "cc-sc6vuo",
      };
      const C = () => (
        <CC>
          <CS>{[_]}</CS>
          {<div className={ax([styles.annotationStyles])} />}
        </CC>
      );
      "
    `);
  });

  it('should inject shared multi-selector sheet BEFORE individual override sheets — nested .ProseMirror pattern with template literal keys', () => {
    // This mirrors the EXACT editor annotation styles pattern where:
    // 1. Selectors are derived from constants via template literals
    // 2. The styles are nested under a .ProseMirror parent selector
    // 3. The shared multi-selector rule uses a computed template literal key
    // The critical invariant: shared base sheet (border-bottom shorthand) must be
    // injected BEFORE individual override sheets (border-bottom-color) in the CS array.
    const actual = transformPretty(
      `
      import { cssMap, cssMapScoped } from '@compiled/react';
      const sharedSelector = '.ak-editor-annotation-blur, .ak-editor-annotation-focus, .ak-editor-annotation-draft, .ak-editor-annotation-hover';
      const styles = cssMapScoped({
        annotationStyles: {
          '.ProseMirror': {
            [sharedSelector]: {
              borderBottom: '2px solid transparent',
              cursor: 'pointer',
            },
            '.ak-editor-annotation-focus': { background: 'yellow', borderBottomColor: 'orange' },
            '.ak-editor-annotation-draft': { background: 'gold', borderBottomColor: 'orange', cursor: 'auto' },
            '.ak-editor-annotation-blur': { background: 'lightyellow', borderBottomColor: 'orange' },
            '.ak-editor-annotation-hover': { background: 'gold', borderBottomColor: 'orange' },
          },
        },
      });
      const C = () => <div css={styles.annotationStyles} />;
    `,
      { pretty: true }
    );

    // The critical invariant: the CS injection array must have the shared base sheet (_)
    // as the FIRST element, and individual override sheets (_2, _3...) AFTER.
    // CSS injection order determines cascade: later = higher priority.
    // So: shared base (border-bottom shorthand) must be injected first,
    // individual overrides (border-bottom-color) must be injected after to win.
    //
    // Note: in the JS source, individual sheet variables are declared BEFORE the shared
    // one (due to how transformCssItems processes cssItems). This is correct —
    // the CS array [_, _2, _3] still injects _ first regardless of declaration order.
    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ =
        ".cc-sc6vuo .ProseMirror .ak-editor-annotation-blur,.cc-sc6vuo .ProseMirror .ak-editor-annotation-draft,.cc-sc6vuo .ProseMirror .ak-editor-annotation-focus,.cc-sc6vuo .ProseMirror .ak-editor-annotation-hover{border-bottom:2px solid transparent;cursor:pointer}.cc-sc6vuo .ProseMirror .ak-editor-annotation-focus{background-color:yellow;border-bottom-color:orange}.cc-sc6vuo .ProseMirror .ak-editor-annotation-draft{background-color:gold;border-bottom-color:orange;cursor:auto}.cc-sc6vuo .ProseMirror .ak-editor-annotation-blur{background-color:lightyellow;border-bottom-color:orange}.cc-sc6vuo .ProseMirror .ak-editor-annotation-hover{background-color:gold;border-bottom-color:orange}";
      const sharedSelector =
        ".ak-editor-annotation-blur, .ak-editor-annotation-focus, .ak-editor-annotation-draft, .ak-editor-annotation-hover";
      const styles = {
        annotationStyles: "cc-sc6vuo",
      };
      const C = () => (
        <CC>
          <CS>{[_]}</CS>
          {<div className={ax([styles.annotationStyles])} />}
        </CC>
      );
      "
    `);
  });

  it('should produce one non-atomic cc- class per variant — atomic cssMap baseline comparison', () => {
    const actual = transformPretty(`
      import { cssMapScoped } from '@compiled/react';

      const styles = cssMapScoped({
        panelStyles: {
          '.panel': { padding: '8px', backgroundColor: 'blue' },
          '.panel-title': { fontWeight: 'bold', color: 'blue' },
        },
        dangerStyles: {
          '.panel': { backgroundColor: 'pink' },
          '.panel-title': { color: 'red' },
        },
      });
      const C = ({ isDanger }) => <div css={[styles.panelStyles, isDanger && styles.dangerStyles]} />;
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 =
        ".cc-1nl3kcl .panel{background-color:pink}.cc-1nl3kcl .panel-title{color:red}";
      const _ =
        ".cc-1ves40c .panel{padding-top:8px;padding-right:8px;padding-bottom:8px;padding-left:8px;background-color:blue}.cc-1ves40c .panel-title{font-weight:bold;color:blue}";
      const styles = {
        panelStyles: "cc-1ves40c",
        dangerStyles: "cc-1nl3kcl",
      };
      const C = ({ isDanger }) => (
        <CC>
          <CS>{[_, _2]}</CS>
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

  it('should support pseudo-selectors, at-rules and conditional application', () => {
    const actual = transformPretty(`
      import { cssMapScoped } from '@compiled/react';

      const styles = cssMapScoped({
        base: {
          color: 'red',
          '&:hover': { color: 'darkred' },
          '@media (min-width: 768px)': { color: 'blue' },
        },
        muted: { color: 'gray' },
      });
      const C = ({ isMuted }) => <div css={[styles.base, isMuted && styles.muted]} />;
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = ".cc-1jz7jn7{color:gray}";
      const _ =
        ".cc-bhu58x{color:red}.cc-bhu58x:hover{color:darkred}@media (min-width:768px){.cc-bhu58x{color:blue}}";
      const styles = {
        base: "cc-bhu58x",
        muted: "cc-1jz7jn7",
      };
      const C = ({ isMuted }) => (
        <CC>
          <CS>{[_, _2]}</CS>
          {<div className={ax([styles.base, isMuted && styles.muted])} />}
        </CC>
      );
      "
    `);
  });

  it('should error out if a second argument is passed to cssMapScoped', () => {
    expect(() => {
      transformPretty(`
        import { cssMapScoped } from '@compiled/react';
        const styles = cssMapScoped({ danger: { color: 'red' } }, { someOption: true });
      `);
    }).toThrow(`cssMapScoped ${ErrorMessages.NUMBER_OF_ARGUMENT}`);
  });

  it('should error out if cssMapScoped is not declared at the top-most scope', () => {
    expect(() => {
      transformPretty(`
        import { cssMapScoped } from '@compiled/react';
        const styles = {
          map1: cssMapScoped({ danger: { color: 'red' } }),
        };
      `);
    }).toThrow(ErrorMessages.DEFINE_MAP);
  });
});
