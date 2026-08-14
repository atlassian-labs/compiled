import { render } from '@testing-library/react';
import React from 'react';
import type { ComponentType } from 'react';

import StyleWithContainer from '../style';
import { StyleContainerProvider } from '../style-container';
import type * as StyleContainerModule from '../style-container';

jest.mock('../is-server-environment', () => ({
  isServerEnvironment: () => false,
}));

describe('<Style />', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    document.head.innerHTML = '';
  });

  // We want to isolate the test to correctly mimic the environment being loaded in once
  const createIsolatedTest = (
    callback: (Style: ComponentType<{ children: string[]; nonce?: string }>) => void
  ) => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Style = require('../style');

      callback(Style.default);
    });
  };

  it('should render nothing on the client', () => {
    createIsolatedTest((Style) => {
      const { baseElement } = render(<Style>{[`.a { display: block; }`]}</Style>);

      expect(baseElement.getElementsByTagName('style')).toHaveLength(0);
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  it('should add style to the head on the client', () => {
    createIsolatedTest((Style) => {
      render(<Style>{[`.b { display: block; }`]}</Style>);

      expect(document.head.innerHTML).toInclude('<style>.b { display: block; }</style>');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  it('should only add one style if it was already added', () => {
    createIsolatedTest((Style) => {
      render(<Style>{[`.c { display: block; }`]}</Style>);
      render(<Style>{[`.c { display: block; }`]}</Style>);

      expect(document.head.innerHTML).toIncludeRepeated('<style>.c { display: block; }</style>', 1);
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  it('should noop in prod', () => {
    createIsolatedTest((Style) => {
      process.env.NODE_ENV = 'production';

      render(<Style>{[`.c:first-child { display: block; }`]}</Style>);

      expect(console.error).not.toHaveBeenCalled();
    });
  });

  it('should warn in dev when using a dangerous pseudo selector', () => {
    createIsolatedTest((Style) => {
      process.env.NODE_ENV = 'development';

      render(<Style>{[`.c:first-child { display: block; }`]}</Style>);

      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });

  it('should warn in dev only once', () => {
    createIsolatedTest((Style) => {
      process.env.NODE_ENV = 'development';

      render(<Style>{[`.c:first-child { display: block; }`]}</Style>);
      render(<Style>{[`.c:first-child { display: block; }`]}</Style>);

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching('Selectors ":first-child, :nth-child" are dangerous to use')
      );
    });
  });

  it('should render style tags in buckets', () => {
    createIsolatedTest((Style) => {
      render(
        <Style>
          {[
            `._a1234567:hover{ color: red; }`,
            `._b1234567:active{ color: blue; }`,
            `._c1234567:link{ color: green; }`,
            `._d1234567{ display: block; }`,
            `@media (max-width: 800px){ ._e1234567{ color: yellow; } }`,
            `._f1234567:focus{ color: pink; }`,
            `._g1234567:visited{ color: grey; }`,
            `._h1234567:focus-visible{ color: white; }`,
            `._i1234567:focus-within{ color: black; }`,
          ]}
        </Style>
      );

      expect(document.head.innerHTML.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
        "<style>._d1234567{ display: block; }</style>
        <style>._c1234567:link{ color: green; }</style>
        <style>._g1234567:visited{ color: grey; }</style>
        <style>._i1234567:focus-within{ color: black; }</style>
        <style>._f1234567:focus{ color: pink; }</style>
        <style>._h1234567:focus-visible{ color: white; }</style>
        <style>._a1234567:hover{ color: red; }</style>
        <style>._b1234567:active{ color: blue; }</style>
        <style>@media (max-width: 800px){ ._e1234567{ color: yellow; } }</style>
        "
      `);
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  it('should render shorthands in buckets', () => {
    // Our buckets don't actually support mixing pseudo-selectors with shorthand
    // properties, so the pseudo-selector buckets don't have correct shorthand
    // property order...
    createIsolatedTest((Style) => {
      render(
        <Style>
          {[
            `._a1234567:hover{ all: revert; }`,
            `._a1234567{ all: unset; }`,
            `._b1234567{ border: solid 1px blue; }`,
            `._c1234567{ border-block: solid 2px blue; }`,
            `._d1234567{ border-block-end: solid 3px blue; }`,
            `._e1234567{ border-bottom: solid 4px blue; }`,
            `._g1234567{ border-inline: solid 5px blue; }`,
            `._h1234567{ border-top: solid 6px blue; }`,
            `._i1234567{ border-top-color: pink; }`,
            `._j1234567{ padding: 5px; }`,
            `._k1234567{ padding-block: 6px; }`,
            `._l1234567{ padding-inline: 7px; }`,
            `._m1234567{ padding-top: 8px; }`,

            `._g1234567:hover{ border-inline: solid 5px blue; }`,
            `._k1234567:hover{ padding-block: 6px; }`,
            `._l1234567:hover{ padding-inline: 7px; }`,
            `._j1234567:hover{ padding: 5px; }`,
          ]}
        </Style>
      );
      expect(document.head.innerHTML.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
        "<style>._a1234567{ all: unset; }</style>
        <style>._b1234567{ border: solid 1px blue; }._j1234567{ padding: 5px; }</style>
        <style>._k1234567{ padding-block: 6px; }._l1234567{ padding-inline: 7px; }</style>
        <style>._c1234567{ border-block: solid 2px blue; }._g1234567{ border-inline: solid 5px blue; }</style>
        <style>._e1234567{ border-bottom: solid 4px blue; }._h1234567{ border-top: solid 6px blue; }</style>
        <style>._d1234567{ border-block-end: solid 3px blue; }</style>
        <style>._i1234567{ border-top-color: pink; }._m1234567{ padding-top: 8px; }</style>
        <style>._a1234567:hover{ all: revert; }._g1234567:hover{ border-inline: solid 5px blue; }._k1234567:hover{ padding-block: 6px; }._l1234567:hover{ padding-inline: 7px; }._j1234567:hover{ padding: 5px; }</style>
        "
      `);
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  it('should update styles', () => {
    createIsolatedTest((Style) => {
      const { rerender } = render(<Style>{[`.first-render { display: block; }`]}</Style>);

      rerender(<Style>{[`.second-render { display: block; }`]}</Style>);

      expect(document.head.innerHTML).toInclude('.second-render { display: block; }');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('cssMapScoped — non-atomic style injection', () => {
    // Helper: read all CSS text from <style> tags via textContent (works for both
    // appendData/appendChild text-node paths AND insertRule cssRules-based injection)
    const getAllCssText = () =>
      Array.from(document.head.querySelectorAll('style'))
        .map((s) => {
          const sheet = (s as HTMLStyleElement).sheet as CSSStyleSheet | null;
          // Prefer cssRules (real browser path) — falls back to textContent (jsdom path)
          if (sheet?.cssRules?.length) {
            return Array.from(sheet.cssRules)
              .map((r) => r.cssText)
              .join('');
          }
          return s.textContent ?? '';
        })
        .join('');

    it('should inject cssMapScoped rules into the catch-all style bucket, not a shorthand bucket', () => {
      createIsolatedTest((Style) => {
        // border-bottom is shorthand depth 4 → would normally go to s-4 bucket
        // but cc- rules must always go to the catch-all '' bucket
        const sharedRule =
          '.cc-abc123 .ProseMirror .blur,.focus{border-bottom:2px solid transparent}';
        render(<Style>{[sharedRule]}</Style>);

        expect(getAllCssText()).toInclude('border-bottom');
        // Should only be one style element (catch-all '' bucket), not split into s-4
        expect(document.head.querySelectorAll('style')).toHaveLength(1);
      });
    });

    it('should preserve source order — shared base rule before individual overrides', () => {
      createIsolatedTest((Style) => {
        // This mirrors the real annotation styles cascade issue:
        // shared multi-selector (border-bottom shorthand) must appear BEFORE
        // individual overrides (border-bottom-color longhand) in the style tag.
        const sharedRule =
          '.cc-abc123 .ProseMirror .blur,.focus{border-bottom:2px solid transparent}';
        const overrideRule =
          '.cc-abc123 .ProseMirror .focus{background:yellow;border-bottom-color:orange}';

        render(<Style>{[sharedRule, overrideRule]}</Style>);

        const text = getAllCssText();
        const sharedIdx = text.indexOf('border-bottom:');
        const overrideIdx = text.indexOf('border-bottom-color');

        expect(sharedIdx).toBeGreaterThan(-1);
        expect(overrideIdx).toBeGreaterThan(-1);
        // Shared base must appear BEFORE individual override
        expect(sharedIdx).toBeLessThan(overrideIdx);
      });
    });

    it('should keep all rules for a variant in the same bucket regardless of their first CSS property', () => {
      createIsolatedTest((Style) => {
        // background → shorthand depth 1 → s-1 bucket (without fix)
        // border-bottom → shorthand depth 4 → s-4 bucket (without fix)
        // Both should land in '' catch-all bucket with the fix
        const bgRule = '.cc-def456 .panel{background:blue;color:white}';
        const borderRule = '.cc-def456 .title{border-bottom:1px solid red;font-weight:bold}';

        render(<Style>{[bgRule, borderRule]}</Style>);

        const text = getAllCssText();
        const bgIdx = text.indexOf('background');
        const borderIdx = text.indexOf('border-bottom');

        expect(bgIdx).toBeGreaterThan(-1);
        expect(borderIdx).toBeGreaterThan(-1);
        // Both in same bucket → source order preserved
        expect(bgIdx).toBeLessThan(borderIdx);
      });
    });

    it('should inject a multi-rule joined sheet string from cssMapScoped (regression test)', () => {
      // cssMapScoped joins all rules for a variant into ONE sheet string for perf.
      // Runtime must handle multi-rule strings correctly — `insertRule` only accepts
      // a SINGLE rule per call, so we use Text.appendData instead. This test exercises
      // the exact format that broke runtime injection in production.
      createIsolatedTest((Style) => {
        const multiRuleSheet =
          '.cc-multi .panel{color:blue;padding:8px}' +
          '.cc-multi .title{font-weight:bold}' +
          '.cc-multi .icon{width:24px}' +
          '.cc-multi .icon svg{fill:currentColor}';

        render(<Style>{[multiRuleSheet]}</Style>);

        // Snapshot: the entire multi-rule string must be present, in order, intact.
        // If `insertRule` was used (and silently failed on multi-rule input), the
        // output would be empty. If a rule splitter mangled the input, the output
        // would differ. This snapshot catches both regressions.
        expect(getAllCssText()).toMatchInlineSnapshot(
          `".cc-multi .panel {color: blue; padding: 8px;}.cc-multi .title {font-weight: bold;}.cc-multi .icon {width: 24px;}.cc-multi .icon svg {fill: currentColor;}"`
        );
      });
    });

    it('should append subsequent sheets to the same <style> element (single text node)', () => {
      // Verifies the appendData fast path: first call creates a text node,
      // subsequent calls append to the existing text node (no new nodes).
      createIsolatedTest((Style) => {
        const firstSheet = '.cc-first .panel{color:blue}';
        const secondSheet = '.cc-second .panel{color:red}';

        render(<Style>{[firstSheet, secondSheet]}</Style>);

        // Only ONE <style> element (catch-all bucket)
        const styles = document.head.querySelectorAll('style');
        expect(styles).toHaveLength(1);

        // Only ONE text node inside the <style> (appendData kept it as one node,
        // not multiple separate text nodes from repeated appendChild)
        const style = styles[0];
        const textNodes = Array.from(style.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE);
        expect(textNodes).toHaveLength(1);

        // Both sheets must be present in the text node
        const text = getAllCssText();
        expect(text).toInclude('.cc-first');
        expect(text).toInclude('.cc-second');
      });
    });

    it('should inject atomic cssMap rules and cssMapScoped rules into separate buckets', () => {
      createIsolatedTest((Style) => {
        // atomic rule: border-bottom shorthand → s-4 bucket
        // non-atomic rule: cc- → '' catch-all bucket
        const atomicRule = '._1UtDYzynoA{color:blue}';
        const nonAtomicRule = '.cc-abc123 .panel{border-bottom:1px solid red;padding:8px}';

        render(<Style>{[atomicRule, nonAtomicRule]}</Style>);

        // Both rules must be present, even if in separate <style> buckets
        const text = getAllCssText();
        expect(text).toInclude('_1UtDYzynoA');
        expect(text).toInclude('.cc-abc123 .panel');
      });
    });

    /**
     * Regression: `@compiled/react` production runtime style wipe when mixing
     * atomic CSSOM insertion with `cssMapScoped`.
     *
     * In production, atomic rules are injected via `sheet.insertRule()` — a
     * CSSOM-only mutation that leaves the `<style>` element's `textContent`
     * empty. When a subsequent `.cc-` (cssMapScoped) sheet is appended via
     * `Text.appendData()` on the SAME `<style>` element, the browser reparses
     * the sheet from its text node and DISCARDS every previously
     * `insertRule`-inserted rule → observable global style wipe.
     *
     * The fix: non-atomic (`.cc-`) rules must never target a `<style>` element
     * that atomic rules have `insertRule`-populated. They must live in a
     * dedicated bucket / DOM node so the two insertion strategies never mix.
     *
     * This test asserts the contract at the runtime seam: atomic rules
     * previously inserted via `insertRule` must still be reachable via
     * `sheet.cssRules` after a large `.cc-` non-atomic sheet is injected.
     */
    describe('regression: production insertRule rules must survive subsequent .cc- appendData injection', () => {
      // Snapshot rules from every <style> in the head at the moment of call,
      // reading BOTH the CSSOM (`sheet.cssRules`) and the text-node (`textContent`).
      // The bug's fingerprint is: CSSOM rule count drops after `.cc-` injection
      // because the browser reparsed the sheet from its (now non-empty) text node.
      const snapshotAtomicRules = (): { element: HTMLStyleElement; cssomRules: string[] }[] =>
        Array.from(document.head.querySelectorAll('style')).map((element) => {
          const sheet = (element as HTMLStyleElement).sheet as CSSStyleSheet | null;
          const cssomRules = sheet?.cssRules
            ? Array.from(sheet.cssRules).map((r) => r.cssText)
            : [];
          return { element, cssomRules };
        });

      // `NODE_ENV` is a process-wide global — mutating it inside a test without
      // restoring it leaks into every later test in the suite (the runtime paths
      // change based on it). Wrap each test's body in a save/restore so these
      // production-only regressions do not affect neighbouring tests (e.g. the
      // `StyleContainerProvider` block, which renders in the default env).
      const withProdNodeEnv = (body: () => void): void => {
        const previousNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        try {
          body();
        } finally {
          process.env.NODE_ENV = previousNodeEnv;
        }
      };

      it('should not wipe atomic rules when a large .cc- non-atomic sheet is later injected (production)', () => {
        withProdNodeEnv(() => {
          createIsolatedTest((Style) => {
            // 1. Insert many atomic rules — production path uses `insertRule`
            //    (CSSOM-only; text node stays empty).
            const atomicRules: string[] = [];
            for (let i = 0; i < 50; i++) {
              atomicRules.push(`._atomic${i}{color:rgb(${i},0,0)}`);
            }
            render(<Style>{atomicRules}</Style>);

            const before = snapshotAtomicRules();
            const totalCssomRulesBefore = before.reduce((n, s) => n + s.cssomRules.length, 0);
            // Sanity: the atomic rules did land somewhere as CSSOM rules.
            expect(totalCssomRulesBefore).toBeGreaterThanOrEqual(atomicRules.length);

            // 2. Now inject a large non-atomic (.cc-) sheet — the trigger.
            //    In the buggy runtime this calls `Text.appendData` on the same
            //    catch-all `<style>` that owns the atomic CSSOM rules, causing
            //    the browser to reparse from text and discard them.
            const largeNonAtomicSheet =
              '.cc-editor .panel{color:blue;padding:8px;border-bottom:1px solid red}' +
              '.cc-editor .title{font-weight:bold;font-size:16px}' +
              '.cc-editor .icon{width:24px;height:24px}' +
              '.cc-editor .icon svg{fill:currentColor}' +
              '.cc-editor .body{background:white;margin:16px}';
            render(<Style>{[largeNonAtomicSheet]}</Style>);

            // 3. Assert: every atomic rule that existed before is still present
            //    in some <style>'s CSSOM. If any atomic rule went missing, the
            //    runtime mixed CSSOM+text on the same element and we regressed.
            const after = snapshotAtomicRules();
            const allCssomRulesAfter = after.flatMap((s) => s.cssomRules).join('\n');
            for (const atomicRule of atomicRules) {
              // Match on the atomic class token; browsers may normalize whitespace
              // inside the rule text (e.g. `{color: rgb(...)}` vs `{color:rgb(...)}`).
              const classToken = atomicRule.slice(0, atomicRule.indexOf('{'));
              expect(allCssomRulesAfter).toInclude(classToken);
            }

            // And the non-atomic sheet itself must still be reachable.
            const text = getAllCssText();
            expect(text).toInclude('.cc-editor .panel');
          });
        });
      });

      it('should never Text.appendData onto a <style> whose sheet already has insertRule-inserted rules', () => {
        withProdNodeEnv(() => {
          createIsolatedTest((Style) => {
            // Seed atomic rules first (CSSOM insertion path).
            render(<Style>{['._atomic1{color:red}', '._atomic2{color:green}']}</Style>);

            // Snapshot which <style> elements have CSSOM rules right now.
            const cssomOwnedElements = new Set(
              Array.from(document.head.querySelectorAll('style')).filter((el) => {
                const sheet = (el as HTMLStyleElement).sheet as CSSStyleSheet | null;
                return !!sheet?.cssRules && sheet.cssRules.length > 0;
              })
            );

            // Capture textContent BEFORE injecting the non-atomic sheet.
            const textBefore = new Map<HTMLStyleElement, string>();
            for (const el of cssomOwnedElements) {
              textBefore.set(el as HTMLStyleElement, el.textContent ?? '');
            }

            // Inject non-atomic sheet — this is the moment the bug manifests.
            render(<Style>{['.cc-x .panel{color:blue;padding:8px}']}</Style>);

            // Contract: no CSSOM-owned <style> element should have had its text
            // content mutated. If any one did, the runtime broke the isolation
            // invariant and the reparse-wipe becomes possible.
            for (const [element, before] of textBefore) {
              expect(element.textContent ?? '').toEqual(before);
            }
          });
        });
      });
    });
  });

  describe('StyleContainerProvider', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should insert styles into the provided container instead of document.head', () => {
      render(
        <StyleContainerProvider container={container} cacheKey="test">
          <StyleWithContainer>{[`.a { color: red; }`]}</StyleWithContainer>
        </StyleContainerProvider>
      );

      expect(container.innerHTML).toInclude('.a { color: red; }');
      expect(document.head.innerHTML).not.toInclude('.a { color: red; }');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should maintain bucket ordering within the container', () => {
      render(
        <StyleContainerProvider container={container} cacheKey="test">
          <StyleWithContainer>
            {[
              `._a1234567:hover{ color: red; }`,
              `._b1234567:active{ color: blue; }`,
              `._c1234567{ display: block; }`,
              `@media (max-width: 800px){ ._d1234567{ color: yellow; } }`,
            ]}
          </StyleWithContainer>
        </StyleContainerProvider>
      );

      expect(container.innerHTML.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
        "<style>._c1234567{ display: block; }</style>
        <style>._a1234567:hover{ color: red; }</style>
        <style>._b1234567:active{ color: blue; }</style>
        <style>@media (max-width: 800px){ ._d1234567{ color: yellow; } }</style>
        "
      `);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should not insert duplicate styles into the container', () => {
      render(
        <StyleContainerProvider container={container} cacheKey="test">
          <StyleWithContainer>{[`.b { color: blue; }`]}</StyleWithContainer>
          <StyleWithContainer>{[`.b { color: blue; }`]}</StyleWithContainer>
        </StyleContainerProvider>
      );

      expect(container.innerHTML).toIncludeRepeated('.b { color: blue; }', 1);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should track container and document.head caches independently using cacheKey', () => {
      // Render the same style into both the main document and a container.
      // Each should receive its own copy since they are independent targets.
      render(<StyleWithContainer>{[`.c { color: green; }`]}</StyleWithContainer>);

      render(
        <StyleContainerProvider container={container} cacheKey="shadow">
          <StyleWithContainer>{[`.c { color: green; }`]}</StyleWithContainer>
        </StyleContainerProvider>
      );

      expect(document.head.innerHTML).toInclude('.c { color: green; }');
      expect(container.innerHTML).toInclude('.c { color: green; }');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should track two containers independently using different cacheKeys', () => {
      const container2 = document.createElement('div');
      document.body.appendChild(container2);

      render(
        <StyleContainerProvider container={container} cacheKey="shadow-a">
          <StyleWithContainer>{[`.d { color: pink; }`]}</StyleWithContainer>
        </StyleContainerProvider>
      );

      render(
        <StyleContainerProvider container={container2} cacheKey="shadow-b">
          <StyleWithContainer>{[`.d { color: pink; }`]}</StyleWithContainer>
        </StyleContainerProvider>
      );

      expect(container.innerHTML).toInclude('.d { color: pink; }');
      expect(container2.innerHTML).toInclude('.d { color: pink; }');

      document.body.removeChild(container2);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should forward nonce to style elements in the container', () => {
      render(
        <StyleContainerProvider container={container} cacheKey="test">
          <StyleWithContainer nonce="abc123">{[`.e { color: orange; }`]}</StyleWithContainer>
        </StyleContainerProvider>
      );

      expect(container.innerHTML).toInclude('nonce="abc123"');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should warn in dev when used in a server environment', () => {
      jest.resetModules();
      jest.doMock('../is-server-environment', () => ({
        isServerEnvironment: () => true,
      }));

      // Re-require to pick up the new mock
      const { StyleContainerProvider: ServerStyleContainerProvider } =
        jest.requireActual<typeof StyleContainerModule>('../style-container');

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { container: renderContainer } = render(
        <ServerStyleContainerProvider container={container} cacheKey="test">
          <div />
        </ServerStyleContainerProvider>
      );

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '@compiled/react: StyleContainerProvider has no effect in server environments.'
        )
      );
      // Children should still be rendered
      expect(renderContainer.querySelector('div')).not.toBeNull();

      warnSpy.mockRestore();
      jest.resetModules();
    });
  });
});
