import { insertRule } from '@compiled/react/runtime';

/**
 * Module-scoped cache of CSS rules already inserted by this runtime.
 *
 * We dedupe by exact rule string so that re-evaluating a module (e.g. during
 * HMR or in environments with module duplication) does not insert the same
 * rule twice. The underlying `insertRule` already has its own bucket-level
 * dedup for the production path, but a string-set cache short-circuits even
 * the cheap work — and keeps semantics identical between dev and prod.
 */
const inserted = new Set<string>();

/**
 * Insert each atomic CSS rule in `sheets` into the document head, exactly
 * once per unique rule. No-op outside a browser environment.
 *
 * Note: despite the name, the rules passed to this function are *not* global
 * unscoped CSS — they are the same atomic, hash-scoped rules Compiled emits
 * elsewhere via `<CC><CS>`. The function exists because vanilla mode has no
 * React render pass to host those style components, so the rules must be
 * inserted directly. Naming intentionally avoids `injectGlobal`, which has an
 * established meaning of "unscoped global CSS" in the wider CSS-in-JS
 * ecosystem.
 *
 * The Babel plugin emits a call to this function for every vanilla `cssMap`
 * declaration it transforms:
 *
 * ```ts
 * // Source
 * const styles = cssMap({ base: { color: 'red' } });
 *
 * // Output
 * import { insertSheets } from '@compiled/vanilla/runtime';
 * insertSheets(['._abc1234{color:red}']);
 * const styles = { base: '_abc1234' };
 * ```
 *
 * @param sheets List of fully-formed atomic CSS rules to insert.
 */
export default function insertSheets(sheets: string[]): void {
  if (typeof document === 'undefined') {
    // Server / non-DOM environments: nothing to do. SSR style extraction is
    // handled by `@compiled/babel-plugin-strip-runtime`, which removes
    // `insertSheets(...)` calls entirely and writes their arguments to a
    // sibling `.compiled.css` file.
    return;
  }

  for (let i = 0; i < sheets.length; i++) {
    const rule = sheets[i];
    if (inserted.has(rule)) continue;
    inserted.add(rule);
    insertRule(rule, {});
  }
}

/**
 * Test-only helper to clear the deduplication cache. Not exported from the
 * public runtime entry; intended for use by `@compiled/jest` and unit tests.
 */
export const clearInsertedCache = (): void => {
  inserted.clear();
};
