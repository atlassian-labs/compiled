import { sortStyleRulesForDeterministicOutput } from '../index';

describe('sortStyleRulesForDeterministicOutput', () => {
  it('sorts atomic rules lexically for deterministic output', () => {
    expect(sortStyleRulesForDeterministicOutput(['._b{color:red}', '._a{color:blue}'])).toEqual([
      '._a{color:blue}',
      '._b{color:red}',
    ]);
  });

  it('preserves non-atomic cssMapScoped rule order', () => {
    expect(
      sortStyleRulesForDeterministicOutput([
        '.cc-z .editor .panel{background-color:pink}',
        '.cc-a .editor .panel{background-color:gray}',
      ])
    ).toEqual([
      '.cc-z .editor .panel{background-color:pink}',
      '.cc-a .editor .panel{background-color:gray}',
    ]);
  });

  it('keeps non-atomic rules in order before sorted atomic rules', () => {
    expect(
      sortStyleRulesForDeterministicOutput([
        '.cc-z .editor .panel{background-color:pink}',
        '._b{color:red}',
        '._a{color:blue}',
        '.cc-a .editor .panel{background-color:gray}',
      ])
    ).toEqual([
      '.cc-z .editor .panel{background-color:pink}',
      '.cc-a .editor .panel{background-color:gray}',
      '._a{color:blue}',
      '._b{color:red}',
    ]);
  });

  it('treats wrapped non-atomic at-rules as non-atomic', () => {
    expect(
      sortStyleRulesForDeterministicOutput([
        '@media (min-width:1px){.cc-z .editor .panel{letter-spacing:1px}}',
        '._b{color:red}',
        '@supports (display:grid){@media (min-width:1px){.cc-a .editor .panel{row-gap:9pt}}}',
        '._a{color:blue}',
      ])
    ).toEqual([
      '@media (min-width:1px){.cc-z .editor .panel{letter-spacing:1px}}',
      '@supports (display:grid){@media (min-width:1px){.cc-a .editor .panel{row-gap:9pt}}}',
      '._a{color:blue}',
      '._b{color:red}',
    ]);
  });

  it('does not classify classes that only contain cc- later in the class name as non-atomic', () => {
    expect(
      sortStyleRulesForDeterministicOutput(['.my-cc-class{color:red}', '._a{color:blue}'])
    ).toEqual(['._a{color:blue}', '.my-cc-class{color:red}']);
  });
});
