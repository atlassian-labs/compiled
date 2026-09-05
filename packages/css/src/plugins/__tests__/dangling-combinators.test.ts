import postcss from 'postcss';

import { danglingCombinators } from '../dangling-combinators';

const transform = (css: string) => {
  const result = postcss([danglingCombinators()]).process(css, { from: undefined });
  return result.css;
};

describe('dangling combinators plugin', () => {
  it.each([
    ['>', '.a > { color: red; }'],
    ['+', '.a + { color: red; }'],
    ['~', '.a ~ { color: red; }'],
    ['>', '& > { color: red; }'],
    ['>', '> { color: red; }'],
    ['+', '&:hover + { color: red; }'],
    ['>', '.a, .b > { color: red; }'],
    ['>', '& > { @media (min-width: 100px) { color: red; } } '],
  ])("should throw for a trailing '%s' combinator in `%s`", (combinator, css) => {
    expect(() => transform(css)).toThrow(`Dangling combinator '${combinator}'`);
  });

  it.each([
    '.a > .b { color: red; }',
    '& > * { color: red; }',
    '> div { color: red; }',
    '.a + .b, .c ~ .d { color: red; }',
    '&:hover { color: red; }',
    '.a { color: red; }',
    '.a > .b > .c { color: red; }',
    '& > { .child { color: red; } }',
    '.a + { div { color: red; } }',
  ])('should leave `%s` untouched', (css) => {
    expect(transform(css)).toEqual(css);
  });

  it('should still throw when a trailing combinator rule also owns declarations', () => {
    expect(() => transform('& > { color: blue; .child { color: red; } }')).toThrow(
      "Dangling combinator '>'"
    );
  });

  it('should point at the offending rule', () => {
    expect(() => transform('.ok { color: red; } .a > { color: red; }')).toThrow(
      "Dangling combinator '>' in selector '.a >'"
    );
  });
});
