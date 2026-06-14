import { sort } from '../sort';

/**
 * Tests for non-atomic `cssMapScoped` rule handling in the `sort()` function.
 *
 * Non-atomic rules (prefixed with `cc-`) must:
 * 1. Not be reordered by shorthand or pseudo-selector sorting
 * 2. Preserve their original source order relative to each other (cascade correctness)
 * 3. Not interfere with atomic rule ordering (selectors never overlap)
 *
 * Atomic rule sorting is covered in-depth by:
 *   - packages/css/src/plugins/__tests__/sort-at-rules.test.ts
 *   - packages/css/src/plugins/__tests__/sort-pseudo-selectors.test.ts
 *   - packages/css/src/plugins/__tests__/sort-shorthand-declarations.test.ts
 */
describe('sort — cssMapScoped non-atomic rule handling', () => {
  it('should not reorder non-atomic rules relative to each other', () => {
    // The shared multi-selector rule (border-bottom shorthand) must come BEFORE
    // the individual override rules (border-bottom-color) to ensure correct cascade.
    // sortShorthandDeclarations would normally move border-bottom after background,
    // which would break cascade for non-atomic rules.
    const input = `
      .cc-1vlc911 .ProseMirror .blur,.cc-1vlc911 .ProseMirror .focus { border-bottom: 2px solid transparent; cursor: pointer }
      .cc-1vlc911 .ProseMirror .focus { background: yellow; border-bottom-color: orange }
      .cc-1vlc911 .ProseMirror .blur { background: lightyellow; border-bottom-color: orange }
    `;

    expect(sort(input)).toMatchInlineSnapshot(`
      ".cc-1vlc911 .ProseMirror .blur,.cc-1vlc911 .ProseMirror .focus { border-bottom: 2px solid transparent; cursor: pointer }
            .cc-1vlc911 .ProseMirror .focus { background: yellow; border-bottom-color: orange }
            .cc-1vlc911 .ProseMirror .blur { background: lightyellow; border-bottom-color: orange }
          "
    `);
  });

  it('should preserve source order even when shorthand sorting would reorder them', () => {
    // Without the fix, border-bottom (shorthand, low bucket) would be sorted before
    // background (not a shorthand, high bucket = Infinity), reversing the rules.
    const input =
      '.cc-14qp4ua { background: blue; padding: 8px } .cc-1vj392m { border-bottom: 2px solid red } .cc-8k2pq3n { color: green }';
    expect(sort(input)).toEqual(input);
  });

  it('should sort atomic cssMap rules normally without affecting non-atomic rules', () => {
    // Atomic rules get shorthand sorting applied (border shorthand before border-bottom-color).
    // Non-atomic cc- rules are output unchanged, separate from atomic rules.
    const input = `
      .cc-1vlc911 .panel { background: blue; border-bottom-color: red }
      ._syaz1q9b { color: red }
      ._bbbk3bke { border-bottom-color: orange }
      ._bxs1q9b { border-bottom: 2px solid transparent }
    `;

    expect(sort(input)).toMatchInlineSnapshot(`
      ".cc-1vlc911 .panel { background: blue; border-bottom-color: red }
            ._bxs1q9b { border-bottom: 2px solid transparent }
            ._syaz1q9b { color: red }
            ._bbbk3bke { border-bottom-color: orange }
          "
    `);
  });

  it('should not apply pseudo-selector sorting to cssMapScoped rules', () => {
    // For atomic rules, :link should come before :hover (lvfha order).
    // For non-atomic rules, source order must be preserved regardless.
    const input = '.cc-1vlc911 .panel:hover { color: red } .cc-1vlc911 .panel:link { color: blue }';
    expect(sort(input)).toEqual(input);
  });

  it('should not apply shorthand or pseudo-selector sorting when both are present in non-atomic rules', () => {
    // atomic sortShorthandDeclarations would move border (shorthand) before border-bottom-color (longhand)
    // atomic sortPseudoSelectors would move :link before :hover (lvfha order)
    // neither should apply to non-atomic cc- rules — source order must be preserved exactly
    // Note: leading whitespace on the first node is stripped (raws.before cleared) by sort-style-sheet.
    const input = `
    .cc-1vlc911 .panel:hover { border-bottom-color: orange }
    .cc-1vlc911 .panel:link { border: 2px solid blue }
    .cc-1vlc911 .panel { border-bottom-color: red; border: 2px solid transparent }
    `;

    expect(sort(input)).toMatchInlineSnapshot(`
      ".cc-1vlc911 .panel:hover { border-bottom-color: orange }
          .cc-1vlc911 .panel:link { border: 2px solid blue }
          .cc-1vlc911 .panel { border-bottom-color: red; border: 2px solid transparent }
          "
    `);
  });

  it('should keep atomic and non-atomic rules correctly separated in mixed input', () => {
    // Non-atomic cc- rules are output first, then atomic rules, then atomic @media.
    // Non-atomic rules preserve their source order relative to each other.
    const input = `
      .cc-14qp4ua .panel { border-bottom: 2px solid transparent }
      .cc-14qp4ua .panel:focus { border-bottom-color: orange }
      ._syaz1q9b { color: red }
      @media (min-width: 768px) { ._fpol1q9b { color: blue } }
    `;

    expect(sort(input)).toMatchInlineSnapshot(`
      ".cc-14qp4ua .panel { border-bottom: 2px solid transparent }
            .cc-14qp4ua .panel:focus { border-bottom-color: orange }
            ._syaz1q9b { color: red }
            @media (min-width: 768px) { ._fpol1q9b { color: blue } }
          "
    `);
  });

  it('should preserve source order of non-atomic rules wrapped in @media', () => {
    // Non-atomic @media blocks are NOT merged (unlike atomic ones) to preserve cascade order.
    // cc-14qp4ua (base styles, mobile-first) must stay before cc-1vj392m (overrides, wider breakpoint).
    const input = `
      .cc-14qp4ua .panel { padding: 8px }
      @media (min-width: 768px) { .cc-14qp4ua .panel { color: blue } }
      @media (min-width: 1024px) { .cc-1vj392m .panel { color: red } }
      ._syaz1q9b { color: green }
    `;

    expect(sort(input)).toMatchInlineSnapshot(`
      ".cc-14qp4ua .panel { padding: 8px }
            @media (min-width: 768px) { .cc-14qp4ua .panel { color: blue } }
            @media (min-width: 1024px) { .cc-1vj392m .panel { color: red } }
            ._syaz1q9b { color: green }
          "
    `);
  });

  it('should pass @keyframes through unchanged and place non-atomic rules after atomic rules', () => {
    // @keyframes are passthrough — they go to catchAll and are not sorted.
    // Non-atomic rules referencing the keyframe must appear after atomic rules.
    const input = `
      .cc-14qp4ua .panel { padding: 8px }
      @keyframes cc-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      .cc-14qp4ua .spinner { animation-name: cc-spin; animation-duration: 2s }
      ._syaz1q9b { color: red }
    `;

    expect(sort(input)).toMatchInlineSnapshot(`
      ".cc-14qp4ua .panel { padding: 8px }
            .cc-14qp4ua .spinner { animation-name: cc-spin; animation-duration: 2s }
            ._syaz1q9b { color: red }
            @keyframes cc-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
          "
    `);
  });

  it('should not produce a leading newline when non-atomic rules are moved to the front', () => {
    // Simulates babel-plugin-strip-runtime's styleRules.sort().join('\n') where
    // non-atomic (.cc-) rules sort after atomic (._) rules lexicographically,
    // but sort-style-sheet moves them to the front. The first node's raws.before
    // must be cleared to prevent a leading newline in the output.
    const input = [
      '._1bahesu3{justify-content:flex-end}',
      '._1e0c1txw{display:flex}',
      '.cc-abc123 .test{position:relative}._16jlkb7n{flex-grow:1}',
    ]
      .sort()
      .join('\n');

    const result = sort(input);

    expect(result).not.toMatch(/^\n/);
    expect(result).toMatchInlineSnapshot(`
      ".cc-abc123 .test{position:relative}._1bahesu3{justify-content:flex-end}
      ._1e0c1txw{display:flex}._16jlkb7n{flex-grow:1}"
    `);
  });

  it('should preserve source order of non-atomic rules wrapped in nested @media + @supports', () => {
    // Non-atomic nested at-rules preserve source order — cc-14qp4ua (tablet) before cc-1vj392m (desktop).
    const input = `
      .cc-14qp4ua .panel { padding: 8px }
      @media (min-width: 768px) { @supports (display: grid) { .cc-14qp4ua .panel { color: blue } } }
      ._syaz1q9b { color: green }
      @media (min-width: 1024px) { @supports (display: grid) { .cc-1vj392m .panel { color: red } } }
    `;

    expect(sort(input)).toMatchInlineSnapshot(`
      ".cc-14qp4ua .panel { padding: 8px }
            @media (min-width: 768px) { @supports (display: grid) { .cc-14qp4ua .panel { color: blue } } }
            @media (min-width: 1024px) { @supports (display: grid) { .cc-1vj392m .panel { color: red } } }
            ._syaz1q9b { color: green }
          "
    `);
  });
});
