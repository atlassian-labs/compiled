import postcss from 'postcss';

import { sortAtomicStyleSheet } from '../sort-atomic-style-sheet';

const sort = (css: string): string =>
  postcss([sortAtomicStyleSheet({ sortAtRulesEnabled: true, sortShorthandEnabled: true })])
    .process(css, { from: undefined })
    .css.replace(/\s+/g, ' ')
    .trim();

describe('sortAtomicStyleSheet — non-atomic cc- rule preservation', () => {
  it('should not reorder non-atomic cc- rules relative to each other', () => {
    // The shared multi-selector rule (border-bottom shorthand) must come BEFORE
    // the individual override rules (border-bottom-color) to ensure correct cascade.
    // sortShorthandDeclarations would normally move border-bottom before background,
    // which would break cascade for non-atomic rules.
    const input = `
      .cc-abc123 .ProseMirror .blur,.cc-abc123 .ProseMirror .focus { border-bottom: 2px solid transparent; cursor: pointer }
      .cc-abc123 .ProseMirror .focus { background: yellow; border-bottom-color: orange }
      .cc-abc123 .ProseMirror .blur { background: lightyellow; border-bottom-color: orange }
    `;

    const output = sort(input);

    // The shared rule (border-bottom shorthand) must come BEFORE individual overrides
    const sharedPos = output.indexOf(
      '.cc-abc123 .ProseMirror .blur,.cc-abc123 .ProseMirror .focus'
    );
    const focusPos = output.indexOf('.cc-abc123 .ProseMirror .focus { background');
    const blurPos = output.indexOf('.cc-abc123 .ProseMirror .blur { background');

    expect(sharedPos).toBeLessThan(focusPos);
    expect(sharedPos).toBeLessThan(blurPos);
    expect(focusPos).toBeLessThan(blurPos);
  });

  it('should preserve source order of non-atomic cc- rules even when shorthand sorting would reorder them', () => {
    // Without the fix, border-bottom (shorthand, low bucket) would be sorted before
    // background (not a shorthand, high bucket = Infinity), reversing the rules.
    const input = `
      .cc-aaa { background: blue; padding: 8px }
      .cc-bbb { border-bottom: 2px solid red }
      .cc-ccc { color: green }
    `;

    const output = sort(input);

    const aaaPos = output.indexOf('.cc-aaa');
    const bbbPos = output.indexOf('.cc-bbb');
    const cccPos = output.indexOf('.cc-ccc');

    // Source order must be preserved: aaa, bbb, ccc
    expect(aaaPos).toBeLessThan(bbbPos);
    expect(bbbPos).toBeLessThan(cccPos);
  });

  it('should still sort atomic rules normally when mixed with non-atomic cc- rules', () => {
    const input = `
      .cc-abc123 .panel { background: blue; border-bottom-color: red }
      ._syaz5scu { color: red }
      ._border-abc { border-bottom-color: orange }
      ._bordershort-abc { border-bottom: 2px solid transparent }
    `;

    const output = sort(input);

    // Atomic rules should be sorted (border-bottom shorthand before border-bottom-color)
    const shorthandPos = output.indexOf('border-bottom:');
    const longhandPos = output.indexOf('border-bottom-color: orange');

    expect(shorthandPos).toBeLessThan(longhandPos);

    // Non-atomic cc- rule should appear after atomic rules
    const atomicPos = output.indexOf('._syaz5scu');
    const nonAtomicPos = output.indexOf('.cc-abc123');

    expect(atomicPos).toBeLessThan(nonAtomicPos);
  });

  it('should not apply pseudo-selector sorting to non-atomic cc- rules', () => {
    // For atomic rules, :link should come before :hover (lvfha order).
    // For non-atomic rules, source order must be preserved regardless.
    const input = `
      .cc-abc123 .panel:hover { color: red }
      .cc-abc123 .panel:link { color: blue }
    `;

    const output = sort(input);

    // :hover comes first in source, must remain first in output for non-atomic
    const hoverPos = output.indexOf(':hover');
    const linkPos = output.indexOf(':link');

    expect(hoverPos).toBeLessThan(linkPos);
  });

  it('should handle a mix of atomic and non-atomic rules with at-rules', () => {
    const input = `
      .cc-panel { border-bottom: 2px solid transparent }
      .cc-panel .focus { border-bottom-color: orange }
      ._syaz5scu { color: red }
      @media (min-width: 768px) { ._abc { color: blue } }
    `;

    const output = sort(input);

    // Atomic rule comes before at-rule, non-atomic comes last
    const atomicPos = output.indexOf('._syaz5scu');
    const atRulePos = output.indexOf('@media');
    const nonAtomicPos = output.indexOf('.cc-panel');

    expect(atomicPos).toBeLessThan(atRulePos);
    expect(atRulePos).toBeLessThan(nonAtomicPos);
  });
});
