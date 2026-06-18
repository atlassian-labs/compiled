import { sortStyleRulesForDeterministicOutput, buildDeterministicStylesheet } from '../index';

describe('sortStyleRulesForDeterministicOutput', () => {
  it('preserves non-atomic order, sorts atomic lexically, and partitions non-atomic before atomic', () => {
    expect(
      sortStyleRulesForDeterministicOutput([
        '.cc-zzzzzz .editor .panel{background-color:pink}',
        '._bbbbbbbb{color:red}',
        '._aaaaaaaa{color:blue}',
        '.cc-aaaaaa .editor .panel{background-color:gray}',
      ])
    ).toEqual([
      '.cc-zzzzzz .editor .panel{background-color:pink}',
      '.cc-aaaaaa .editor .panel{background-color:gray}',
      '._aaaaaaaa{color:blue}',
      '._bbbbbbbb{color:red}',
    ]);
  });

  it('classifies at-rule-wrapped .cc- selectors as non-atomic and ignores cc- substrings in other class names', () => {
    expect(
      sortStyleRulesForDeterministicOutput([
        '@media (min-width:1px){.cc-zzzzzz .editor{letter-spacing:1px}}',
        '.my-cc-class{color:red}',
        '._aaaaaaaa{color:blue}',
      ])
    ).toEqual([
      '@media (min-width:1px){.cc-zzzzzz .editor{letter-spacing:1px}}',
      '._aaaaaaaa{color:blue}',
      '.my-cc-class{color:red}',
    ]);
  });
});

describe('buildDeterministicStylesheet', () => {
  it('sorts assets by filePath, preserves non-atomic order per asset, and sorts atomic rules', () => {
    const result = buildDeterministicStylesheet(
      [
        {
          filePath: '/src/z-file.tsx',
          rules: [
            '.cc-zzzzzz{color:red}',
            '._bbbbbbbb{margin:0}',
            '._aaaaaaaa{padding:0}',
            '.cc-aaaaaa{color:blue}',
          ],
        },
        {
          filePath: '/src/a-file.tsx',
          rules: [
            '.cc-bbbbbb .editor .panel{background-color:gray}',
            '.cc-dddddd .editor .panel{background-color:pink}',
          ],
        },
      ],
      { sortAtRulesEnabled: true, sortShorthandEnabled: undefined }
    );

    // a-file assets come first (filePath sorted)
    expect(result.indexOf('.cc-bbbbbb')).toBeLessThan(result.indexOf('.cc-zzzzzz'));
    // non-atomic preserved within each asset: bbbbbb before dddddd, zzzzzz before aaaaaa
    expect(result.indexOf('.cc-bbbbbb')).toBeLessThan(result.indexOf('.cc-dddddd'));
    expect(result.indexOf('.cc-zzzzzz')).toBeLessThan(result.indexOf('.cc-aaaaaa'));
    // atomic sorted within asset: _aaaaaaaa before _bbbbbbbb
    expect(result.indexOf('._aaaaaaaa')).toBeLessThan(result.indexOf('._bbbbbbbb'));
  });

  it('produces deterministic output regardless of asset input order', () => {
    const assets = [
      { filePath: '/src/b.tsx', rules: ['._bbbbbbbb{color:red}'] },
      { filePath: '/src/a.tsx', rules: ['._aaaaaaaa{color:blue}'] },
    ];

    const result1 = buildDeterministicStylesheet(assets, {
      sortAtRulesEnabled: true,
      sortShorthandEnabled: undefined,
    });
    const result2 = buildDeterministicStylesheet([...assets].reverse(), {
      sortAtRulesEnabled: true,
      sortShorthandEnabled: undefined,
    });

    expect(result1).toBe(result2);
  });

  it('respects sortAtRulesEnabled and sortShorthandEnabled config', () => {
    const rules = [
      '._aaaaaaaa{border-color:red}',
      '._bbbbbbbb{border:2px solid blue}',
      '@media screen{._cccccccc{color:blue}}',
    ];

    const withSorting = buildDeterministicStylesheet([{ filePath: '/src/app.tsx', rules }], {
      sortAtRulesEnabled: true,
      sortShorthandEnabled: true,
    });

    // shorthand (border) before longhand (border-color)
    expect(withSorting.indexOf('border:2px')).toBeLessThan(withSorting.indexOf('border-color'));
    // at-rules grouped after non-at-rule atomics
    expect(withSorting.indexOf('._aaaaaaaa')).toBeLessThan(withSorting.indexOf('@media'));
  });
});
