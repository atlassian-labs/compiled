import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';

import { nonAtomicifyRules } from '../non-atomicify-rules';

const FIXED_CLASS = 'cc-test1234';

const transform = (css: TemplateStringsArray) => {
  const result = postcss([
    nested({
      bubble: ['container', '-moz-document', 'layer', 'else', 'when', 'starting-style'],
      unwrap: ['color-profile', 'counter-style', 'font-palette-values', 'page', 'property'],
    }),
    nonAtomicifyRules({ className: FIXED_CLASS }),
    autoprefixer(),
    whitespace(),
  ]).process(css[0], { from: undefined });

  return result.css;
};

describe('non-atomicify rules', () => {
  describe('basic declarations', () => {
    it('should wrap a single top-level declaration under the class', () => {
      const actual = transform`color: blue;`;
      expect(actual).toMatchInlineSnapshot(`".cc-test1234{color:blue}"`);
    });

    it('should wrap multiple top-level declarations under the same class', () => {
      const actual = transform`
        color: blue;
        font-size: 16px;
        padding: 8px;
      `;
      expect(actual).toMatchInlineSnapshot(
        `".cc-test1234{color:blue}.cc-test1234{font-size:16px}.cc-test1234{padding:8px}"`
      );
    });
  });

  describe('selectors', () => {
    it('should scope a nesting selector (&) under the class', () => {
      const actual = transform`
        &:hover { color: red; }
      `;
      expect(actual).toMatchInlineSnapshot(`".cc-test1234:hover{color:red}"`);
    });

    it('should scope a plain child selector under the class', () => {
      const actual = transform`
        .panel { padding: 8px; }
      `;
      expect(actual).toMatchInlineSnapshot(`".cc-test1234 .panel{padding:8px}"`);
    });

    it('should scope a descendant selector under the class', () => {
      const actual = transform`
        .panel-icon svg { fill: currentColor; }
      `;
      expect(actual).toMatchInlineSnapshot(`".cc-test1234 .panel-icon svg{fill:currentColor}"`);
    });

    it('should scope multiple selectors (comma-separated) under the class', () => {
      const actual = transform`
        h1, h2, h3 { font-weight: bold; }
      `;
      expect(actual).toMatchInlineSnapshot(
        `".cc-test1234 h1, .cc-test1234 h2, .cc-test1234 h3{font-weight:bold}"`
      );
    });

    it('should remove empty rules', () => {
      const actual = transform`
        .empty {}
        color: red;
      `;
      expect(actual).toMatchInlineSnapshot(`".cc-test1234{color:red}"`);
    });

    it('should strip CSS comments', () => {
      const actual = postcss([nonAtomicifyRules({ className: FIXED_CLASS }), whitespace()]).process(
        '/* this is a comment */ color: red;',
        { from: undefined }
      ).css;
      expect(actual).toMatchInlineSnapshot(`".cc-test1234{color:red}"`);
    });

    it('should throw if nested rules were not flattened first', () => {
      // postcss-nested must run before nonAtomicifyRules.
      // If a nested rule reaches the plugin, it throws to surface the misconfiguration.
      expect(
        () =>
          postcss([nonAtomicifyRules({ className: FIXED_CLASS })]).process(
            '.parent { .child { color: red; } }',
            { from: undefined }
          ).css
      ).toThrow('Nested rules need to be flattened first');
    });

    it('should strip CSS comments and still scope declarations correctly', () => {
      const actual = postcss([nonAtomicifyRules({ className: FIXED_CLASS }), whitespace()]).process(
        '/* before */ color: red; /* after */ font-size: 16px;',
        { from: undefined }
      ).css;
      expect(actual).toMatchInlineSnapshot(`".cc-test1234{color:red}.cc-test1234{font-size:16px}"`);
    });
  });

  describe('scopeable at-rules (@media, @supports, @container)', () => {
    it('should scope inner rules under the class inside @media', () => {
      const actual = transform`
        color: red;
        @media (min-width: 768px) { color: blue; }
      `;
      expect(actual).toMatchInlineSnapshot(
        `".cc-test1234{color:red}@media (min-width: 768px){.cc-test1234{color:blue}}"`
      );
    });

    it('should scope inner child selectors inside @media', () => {
      const actual = transform`
        @media (max-width: 600px) { .panel { padding: 8px; } }
      `;
      expect(actual).toMatchInlineSnapshot(
        `"@media (max-width: 600px){.cc-test1234 .panel{padding:8px}}"`
      );
    });

    it('should scope inner rules inside @supports', () => {
      const actual = transform`
        display: block;
        @supports not (display: flow-root) { .panel::after { clear: both; } }
      `;
      expect(actual).toMatchInlineSnapshot(
        `".cc-test1234{display:block}@supports not (display: flow-root){.cc-test1234 .panel::after{clear:both}}"`
      );
    });

    it('should scope inner rules inside nested @media > @supports', () => {
      const actual = transform`
        @media (min-width: 768px) { @supports (display: grid) { color: blue; } }
      `;
      expect(actual).toMatchInlineSnapshot(
        `"@media (min-width:768px){@supports (display:grid){.cc-test1234{color:blue}}}"`
      );
    });

    it('should scope inner rules inside @container', () => {
      const actual = transform`
        @container editor-area (max-width: 600px) { .panel { padding: 8px; } }
      `;
      expect(actual).toMatchInlineSnapshot(
        `"@container editor-area (max-width: 600px){.cc-test1234 .panel{padding:8px}}"`
      );
    });
  });

  describe('passthrough at-rules (@keyframes, @property, @font-face)', () => {
    it('should NOT prefix @keyframes stops with the class', () => {
      const actual = transform`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        animation: fadeIn 0.3s ease-in;
      `;
      // @keyframes stops (from/to) must have NO .cc- prefix
      expect(actual).toContain('@keyframes fadeIn{from{opacity:0}to{opacity:1}}');
      // animation declaration IS scoped under the class
      expect(actual).toContain('.cc-test1234{animation:fadeIn 0.3s ease-in}');
    });

    it('should NOT prefix @property descriptors with the class', () => {
      const actual = transform`
        @property --my-color { syntax: '<color>'; inherits: false; initial-value: red; }
        color: var(--my-color);
      `;
      // @property passes through unchanged
      expect(actual).toContain(
        "@property --my-color{syntax:'<color>';inherits:false;initial-value:red}"
      );
      // color declaration IS scoped
      expect(actual).toContain('.cc-test1234{color:var(--my-color)}');
    });

    it('should NOT prefix @font-face descriptors with the class', () => {
      const actual = transform`
        @font-face { font-family: 'MyFont'; src: url('my-font.woff2'); }
        font-family: 'MyFont', sans-serif;
      `;
      // @font-face passes through unchanged
      expect(actual).toContain("@font-face{font-family:'MyFont';src:url('my-font.woff2')}");
      // font-family declaration IS scoped
      expect(actual).toContain(".cc-test1234{font-family:'MyFont',sans-serif}");
    });
  });

  describe('forbidden at-rules', () => {
    it('should throw for @charset', () => {
      expect(() => transform`@charset 'utf-8';`).toThrow(
        "At-rule '@charset' cannot be used in CSS rules."
      );
    });

    it('should throw for @import', () => {
      expect(() => transform`@import 'custom.css';`).toThrow(
        "At-rule '@import' cannot be used in CSS rules."
      );
    });

    it('should throw for @namespace', () => {
      expect(() => transform`@namespace 'XML-namespace-URL';`).toThrow(
        "At-rule '@namespace' cannot be used in CSS rules."
      );
    });
  });

  describe('unknown at-rules', () => {
    it('should throw for unrecognised at-rules', () => {
      expect(() => transform`@asdfghjkl { color: red; }`).toThrow("Unknown at-rule '@asdfghjkl'.");
    });
  });

  describe('autoprefixer', () => {
    beforeEach(() => {
      process.env.BROWSERSLIST = 'last 1 version';
    });

    it('should autoprefix declarations scoped under the non-atomic class', () => {
      const actual = transform`user-select: none;`;
      expect(actual).toMatchInlineSnapshot(
        `".cc-test1234{-webkit-user-select:none;-ms-user-select:none;user-select:none}"`
      );
    });

    it('should autoprefix declarations inside @media scoped under the non-atomic class', () => {
      const actual = transform`
        @media (min-width: 30rem) { user-select: none; }
      `;
      expect(actual).toMatchInlineSnapshot(
        `"@media (min-width: 30rem){.cc-test1234{-webkit-user-select:none;-ms-user-select:none;user-select:none}}"`
      );
    });

    it('should autoprefix declarations inside a scoped child selector', () => {
      const actual = transform`
        .panel { user-select: none; }
      `;
      expect(actual).toMatchInlineSnapshot(
        `".cc-test1234 .panel{-webkit-user-select:none;-ms-user-select:none;user-select:none}"`
      );
    });
  });

  describe('callback', () => {
    it('should call callback once with the class name', () => {
      const received: string[] = [];
      postcss([
        nonAtomicifyRules({
          className: FIXED_CLASS,
          callback: (name) => received.push(name),
        }),
      ]).process('color: red; font-size: 16px;', { from: undefined }).css;

      expect(received).toEqual([FIXED_CLASS]);
    });
  });
});
