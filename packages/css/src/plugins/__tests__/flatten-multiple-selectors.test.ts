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
    atomicifyRules({ collisionResistantHash: true }),
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

    expect(actual).toMatchInlineSnapshot(`"._1UtDYzynoA{color:blue}"`);
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
      `"[data-look='h100']._1u4z38vLZJ{display:block}._1X1ILOYbGa div{display:none}._3EhJFYYbGa div span{display:none}"`
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
      `"._3iDTPbYbGa{display:none}._1dmVT1vLZJ._1dmVT1vLZJ{display:block}"`
    );
  });

  it('should flatten multiple element selectors', () => {
    const actual = transform`
      div, span, li {
        color: blue;
      }
    `;

    expect(actual).toMatchInlineSnapshot(`
      "._0paDgwynoA div{color:blue}
      ._4keetJynoA span{color:blue}
      ._1WG9WaynoA li{color:blue}"
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
      "._0clgaMynoA:hover{color:blue}
      ._10n1R5ynoA:focus{color:blue}"
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
      "._2MYE9XQAma._2MYE9XQAma > *{margin-bottom:1rem}
      ._22pbxRQAma:is(h1, h2, h3){margin-bottom:1rem}
      ._41uVfTQAma div{margin-bottom:1rem}
      ._364IRzQAma:hover{margin-bottom:1rem}
      ._196sguQAma [data-content~="user,id"]{margin-bottom:1rem}
      ._1DCdHiQAma{margin-bottom:1rem}
      ._22pbxRQAma:is(h1, h2, h3){margin-bottom:1rem}
      ._3M1DK5QAma._3M1DK5QAma{margin-bottom:1rem}
      ._4C0jlvQAma._4C0jlvQAma:is(h1, h2, h3){margin-bottom:1rem}
      @media (min-width: 768px){._2hcKcRQAma._2hcKcRQAma > *{margin-bottom:1rem}
      ._1UymnWQAma:is(h1, h2, h3){margin-bottom:1rem}
      ._18yZS6QAma div{margin-bottom:1rem}
      ._46LQbUQAma:hover{margin-bottom:1rem}
      ._1IKOAHQAma [data-content~="user,id"]{margin-bottom:1rem}
      }
      @media (max-width: 768px){@supports (margin-bottom: 1rem){._3CciXNQAma._3CciXNQAma > *{margin-bottom:1rem}
      ._4a63YvQAma:is(h1, h2, h3){margin-bottom:1rem}
      ._0EL2kBQAma div{margin-bottom:1rem}
      ._0PR4fHQAma:hover{margin-bottom:1rem}
      ._3TBi3jQAma [data-content~="user,id"]{margin-bottom:1rem}
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
      `"._0ks3zfPFz6:first-child{color:hotpink}._2WlpiiPFz6:last-child{color:hotpink}._0ks3zfPFz6:first-child{color:hotpink}"`
    );
  });
});
