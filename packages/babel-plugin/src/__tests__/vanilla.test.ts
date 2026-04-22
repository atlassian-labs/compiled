import { transform } from '../test-utils';

describe('@compiled/vanilla support in @compiled/babel-plugin', () => {
  it('transforms a cssMap call from @compiled/vanilla into a className map', () => {
    const actual = transform(
      `
        import { cssMap } from '@compiled/vanilla';

        const styles = cssMap({
          base: { color: 'red' },
          accent: { color: 'blue' },
        });
      `,
      { importReact: false }
    );

    // Result is a plain className-string map; no JSX wrapper.
    expect(actual).toInclude('base:');
    expect(actual).toInclude('accent:');
    // Sheets are inserted via the vanilla runtime, not the React runtime.
    expect(actual).toInclude('import { ax, insertSheets } from "@compiled/vanilla/runtime"');
    expect(actual).toInclude('insertSheets(');
  });

  it('does not import React when only @compiled/vanilla is used', () => {
    const actual = transform(
      `
        import { cssMap } from '@compiled/vanilla';

        const styles = cssMap({
          base: { color: 'red' },
        });
      `,
      { importReact: false }
    );

    expect(actual).not.toInclude('from "react"');
    expect(actual).not.toInclude('forwardRef');
  });

  it('does not import the React runtime when in vanilla mode', () => {
    const actual = transform(
      `
        import { cssMap } from '@compiled/vanilla';

        const styles = cssMap({
          base: { color: 'red' },
        });
      `,
      { importReact: false }
    );

    expect(actual).not.toInclude('@compiled/react/runtime');
    expect(actual).not.toInclude(' CC ');
    expect(actual).not.toInclude(' CS ');
  });

  it('passes each generated atomic sheet to insertSheets', () => {
    const actual = transform(
      `
        import { cssMap } from '@compiled/vanilla';

        const styles = cssMap({
          base: { color: 'red', fontWeight: 'bold' },
        });
      `,
      { importReact: false }
    );

    // Each declaration becomes its own atomic rule passed to insertSheets.
    expect(actual).toInclude('color:red');
    expect(actual).toInclude('font-weight:bold');
    expect(actual).toInclude('insertSheets([');
  });

  it('does not enable vanilla mode for @compiled/react imports', () => {
    const actual = transform(
      `
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          base: { color: 'red' },
        });
      `,
      { importReact: false }
    );

    // React mode keeps the existing @compiled/react/runtime import and does
    // not emit `insertSheets`.
    expect(actual).toInclude('@compiled/react/runtime');
    expect(actual).not.toInclude('insertSheets');
    expect(actual).not.toInclude('@compiled/vanilla/runtime');
  });

  describe('ax', () => {
    it('preserves a standalone ax import from @compiled/vanilla', () => {
      // `ax` is a real runtime function (not a compile-time stub), so when it
      // is the only specifier imported the plugin should leave the user-level
      // call site alone — no rewriting of the call expression.
      //
      // The plugin still appends the vanilla runtime import (since
      // `state.isVanilla` was set during the ImportDeclaration visit) and
      // ships an unused `insertSheets` specifier in that import. That extra
      // specifier is a known minor cost — bundlers will tree-shake it for
      // production builds — and is acceptable for v1. A future optimisation
      // could narrow the appended specifier set to only what was actually
      // used by the file.
      const actual = transform(
        `
          import { ax } from '@compiled/vanilla';

          export const className = ax(['foo', 'bar']);
        `,
        { importReact: false }
      );

      // The user-level ax call is preserved verbatim.
      expect(actual).toInclude('ax(["foo", "bar"])');
      // The original vanilla package import is kept so `ax` resolves through
      // the package's re-export.
      expect(actual).toInclude('from "@compiled/vanilla"');
      // Vanilla runtime is the canonical source for `ax`; React runtime must
      // never be pulled in for a vanilla-only file.
      expect(actual).not.toInclude('@compiled/react/runtime');
    });

    it('exposes ax via the vanilla runtime when cssMap is also used', () => {
      // When `cssMap` triggers the vanilla code path, the plugin appends a
      // runtime import that includes both `ax` and `insertSheets` from
      // `@compiled/vanilla/runtime`. This test guards against accidentally
      // dropping `ax` from the appended specifier list.
      const actual = transform(
        `
          import { cssMap, ax } from '@compiled/vanilla';

          const styles = cssMap({
            base: { color: 'red' },
            accent: { color: 'blue' },
          });

          export const className = ax([styles.base, styles.accent]);
        `,
        { importReact: false }
      );

      expect(actual).toInclude('import { ax, insertSheets } from "@compiled/vanilla/runtime"');
      expect(actual).toInclude('insertSheets([');
      // The user-level ax call is preserved verbatim and resolves against
      // the appended runtime import.
      expect(actual).toInclude('ax([styles.base, styles.accent])');
    });

    it('uses the vanilla runtime ax — never the React runtime ax', () => {
      // Regression guard: even when only the vanilla `cssMap` triggered the
      // append, the runtime module must be `@compiled/vanilla/runtime`, never
      // `@compiled/react/runtime`. Mixing the two would cause two copies of
      // `ax` to ship and would defeat dedup across vanilla and React rules.
      const actual = transform(
        `
          import { cssMap, ax } from '@compiled/vanilla';

          const styles = cssMap({ base: { color: 'red' } });

          export const className = ax([styles.base]);
        `,
        { importReact: false }
      );

      expect(actual).toInclude('@compiled/vanilla/runtime');
      expect(actual).not.toInclude('@compiled/react/runtime');
    });

    it('does not import React even when ax is used standalone', () => {
      // Vanilla mode is React-free regardless of which APIs are used. A
      // standalone `ax` import from `@compiled/vanilla` should never cause
      // an `import * as React from "react"` to be injected.
      const actual = transform(
        `
          import { ax } from '@compiled/vanilla';

          export const className = ax(['_a', '_b']);
        `,
        { importReact: false }
      );

      expect(actual).not.toInclude('from "react"');
      expect(actual).not.toInclude('forwardRef');
    });
  });
});
