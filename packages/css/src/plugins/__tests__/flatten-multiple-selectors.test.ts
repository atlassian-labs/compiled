import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';

import { atomicifyRules } from '../atomicify-rules';
import { flattenMultipleSelectors } from '../flatten-multiple-selectors';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([
    nested({
      bubble: [
        'container',
        '-moz-document',
        'layer',
        'else',
        'when',
        // postcss-nested bubbles `starting-style` by default in versions from 6.0.2 onwards:
        // https://github.com/postcss/postcss-nested?tab=readme-ov-file#bubble
        // When we upgrade to a version that includes this change, we can remove this from the list.
        'starting-style',
      ],
      unwrap: ['color-profile', 'counter-style', 'font-palette-values', 'page', 'property'],
    }),
    atomicifyRules(),
    flattenMultipleSelectors(),
    whitespace(),
    autoprefixer(),
  ]).process(css[0], {
    from: undefined,
  });

  return result.css;
};

describe('flatten multiple selectors', () => {
  beforeEach(() => {
    process.env.BROWSERSLIST = 'last 1 version';
  });

  it('should leave a single declaration alone', () => {
    const actual = transform`
      color: blue;
    `;

    expect(actual).toMatchInlineSnapshot(`"._syaz13q2{color:blue}"`);
  });

  it('should leave a nested selector alone', () => {
    const actual = transform`
      [data-look='h100']& {
        display: block;
      }
      div {
        display: none;
        span {
          display: none;
        }
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"[data-look='h100']._mi0g1ule{display:block}._tkqhglyw div{display:none}._1jaqglyw div span{display:none}"`
    );
  });

  it('should leave a specificity increase alone', () => {
    const result = transform`
      & {
        display: none;
      }
      && {
        display: block;
      }
    `;

    expect(result).toMatchInlineSnapshot(
      `"._1e0cglyw{display:none}._if291ule._if291ule{display:block}"`
    );
  });

  it('should flatten multiple element selectors', () => {
    const actual = transform`
      div, span, li {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "._65g013q2 div{color:blue}
      ._1tjq13q2 span{color:blue}
      ._thoc13q2 li{color:blue}"
    `);
  });

  it('should flatten multiple pseduo selectors', () => {
    // Its assumed the pseudos will get a nesting selector from the nested plugin.
    const actual = transform`
      &:hover, &:focus {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "._30l313q2:hover{color:blue}
      ._f8pj13q2:focus{color:blue}"
    `);
  });

  it('should handle complex selectors', () => {
    const actual = transform`
      && > *, &:is(h1, h2, h3), div, &:hover, [data-content~="user,id"] {
        margin-bottom: 1rem;
      }

      &, && {
        &,&:is(h1, h2, h3) {
          margin-bottom: 1rem;
        }
      }

      @media (min-width: 768px) {
        && > *, &:is(h1, h2, h3), div, &:hover, [data-content~="user,id"] {
          margin-bottom: 1rem;
        }
      }

      @media (max-width: 768px) {
        @supports (margin-bottom: 1rem) {
          && > *, &:is(h1, h2, h3), div, &:hover, [data-content~="user,id"] {
            margin-bottom: 1rem;
          }
        }
      }
    `;

    expect(actual.split('}').join('}\n')).toMatchInlineSnapshot(`
      "._169r1j6v._169r1j6v > *{margin-bottom:1rem}
      ._uw1v1j6v:is(h1, h2, h3){margin-bottom:1rem}
      ._1oyy1j6v div{margin-bottom:1rem}
      ._1axs1j6v:hover{margin-bottom:1rem}
      ._hdj91j6v [data-content~="user,id"]{margin-bottom:1rem}
      ._otyr1j6v{margin-bottom:1rem}
      ._uw1v1j6v:is(h1, h2, h3){margin-bottom:1rem}
      ._1l6u1j6v._1l6u1j6v{margin-bottom:1rem}
      ._1xw41j6v._1xw41j6v:is(h1, h2, h3){margin-bottom:1rem}
      @media (min-width: 768px){._yi8y1j6v._yi8y1j6v > *{margin-bottom:1rem}
      ._syz31j6v:is(h1, h2, h3){margin-bottom:1rem}
      ._h8sc1j6v div{margin-bottom:1rem}
      ._1q9c1j6v:hover{margin-bottom:1rem}
      ._q3671j6v [data-content~="user,id"]{margin-bottom:1rem}
      }
      @media (max-width: 768px){@supports (margin-bottom: 1rem){._1isd1j6v._1isd1j6v > *{margin-bottom:1rem}
      ._1r2l1j6v:is(h1, h2, h3){margin-bottom:1rem}
      ._9ykl1j6v div{margin-bottom:1rem}
      ._co771j6v:hover{margin-bottom:1rem}
      ._1n1h1j6v [data-content~="user,id"]{margin-bottom:1rem}
      }
      }
      "
    `);
  });

  it('should leave duplicate styles alone (that belongs to another plugin)', () => {
    // Its assumed the pseudos will get a nesting selector from the nested plugin.
    const actual = transform`
      &:first-child, &:last-child {
        color: hotpink;
      }
      &:first-child {
        color: hotpink;
      }
    `;

    expect(actual).toMatchInlineSnapshot(
      `"._4zxh1q9v:first-child{color:hotpink}._18k61q9v:last-child{color:hotpink}._4zxh1q9v:first-child{color:hotpink}"`
    );
  });
});
