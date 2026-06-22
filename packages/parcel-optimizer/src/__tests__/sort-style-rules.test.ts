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
            '._dddddddd{font-size:14px}',
            '.cc-dddddd .editor .panel{background-color:pink}',
            '._cccccccc{font-weight:bold}',
          ],
        },
      ],
      { sortAtRulesEnabled: true, sortShorthandEnabled: true }
    );

    expect(result).toBe(
      [
        // a-file (filePath sorted first), non-atomic in source order
        '.cc-bbbbbb .editor .panel{background-color:gray}',
        '.cc-dddddd .editor .panel{background-color:pink}',
        // z-file (filePath sorted second), non-atomic in source order
        '.cc-zzzzzz{color:red}',
        '.cc-aaaaaa{color:blue}',
        // atomic rules sorted lexically across ALL assets
        '._aaaaaaaa{padding:0}',
        '._bbbbbbbb{margin:0}',
        '._cccccccc{font-weight:bold}',
        '._dddddddd{font-size:14px}',
      ].join('')
    );
  });

  it('produces deterministic output regardless of asset input order', () => {
    const assets = [
      { filePath: '/src/b.tsx', rules: ['._bbbbbbbb{color:red}'] },
      { filePath: '/src/a.tsx', rules: ['._aaaaaaaa{color:blue}'] },
    ];

    const result1 = buildDeterministicStylesheet(assets, {
      sortAtRulesEnabled: true,
      sortShorthandEnabled: true,
    });
    const result2 = buildDeterministicStylesheet([...assets].reverse(), {
      sortAtRulesEnabled: true,
      sortShorthandEnabled: true,
    });

    expect(result1).toBe(result2);
  });

  it('deduplicates identical atomic rules across assets and preserves order', () => {
    const result = buildDeterministicStylesheet(
      [
        {
          filePath: '/src/a-file.tsx',
          rules: ['._aaaaaaaa{padding:0}', '._cccccccc{margin:0}'],
        },
        {
          filePath: '/src/b-file.tsx',
          rules: ['._aaaaaaaa{padding:0}', '._bbbbbbbb{color:red}'],
        },
      ],
      { sortAtRulesEnabled: false, sortShorthandEnabled: false }
    );

    expect(result).toBe(
      [
        // a-file first (filePath sorted), atomics in source order within asset
        '._aaaaaaaa{padding:0}',
        // b-file second; _aaaaaaaa deduplicated, _bbbbbbbb added
        '._bbbbbbbb{color:red}',
        // _cccccccc from a-file
        '._cccccccc{margin:0}',
      ].join('')
    );
  });

  it('deduplicates rules across assets when one asset has joined and another has separate format', () => {
    // Reproduces the babel-component-fixture (separate) vs babel-component-extracted-fixture (joined) scenario
    // where the same atomic rules appear in different concatenation formats across assets.
    // PostCSS discardDuplicates handles the deduplication after parsing.
    const result = buildDeterministicStylesheet(
      [
        {
          filePath: '/node_modules/@compiled/babel-component-extracted-fixture/dist/index.js',
          // Joined format (multiple rules in one string entry)
          rules: ['._19it1vrj{border:2px solid transparent}._19bv1vi7{padding-left:32px}'],
        },
        {
          filePath: '/node_modules/@compiled/babel-component-fixture/dist/index.js',
          // Separate format (each rule as its own string entry)
          rules: ['._19it1vrj{border:2px solid transparent}', '._19bv1vi7{padding-left:32px}'],
        },
      ],
      { sortAtRulesEnabled: false, sortShorthandEnabled: false }
    );

    // Each rule appears only ONCE in the final output (deduplication works via PostCSS)
    expect(result).toBe(
      ['._19it1vrj{border:2px solid transparent}', '._19bv1vi7{padding-left:32px}'].join('')
    );
  });

  it('respects sortAtRulesEnabled and sortShorthandEnabled config', () => {
    const rules = [
      '@media screen{._cccccccc{color:blue}}',
      '._aaaaaaaa{border-color:red}',
      '._bbbbbbbb{border:2px solid blue}',
    ];

    const withSorting = buildDeterministicStylesheet([{ filePath: '/src/app.tsx', rules }], {
      sortAtRulesEnabled: true,
      sortShorthandEnabled: true,
    });

    expect(withSorting).toBe(
      [
        // shorthand (border) before longhand (border-color)
        '._bbbbbbbb{border:2px solid blue}',
        '._aaaaaaaa{border-color:red}',
        // at-rules grouped after non-at-rule atomics
        '@media screen{._cccccccc{color:blue}}',
      ].join('')
    );
  });
});
