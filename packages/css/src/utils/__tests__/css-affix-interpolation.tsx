import { cssAffixInterpolation } from '../css-affix-interpolation';

describe('cssAffixInterpolation', () => {
  describe('interpolations with surrounding css', () => {
    it('should extract the prefix of a simple template literal', () => {
      const [before] = cssAffixInterpolation('content: "', '";font-color:blue;');

      expect(before.variablePrefix).toEqual('"');
      expect(before.css).toEqual('content: ');
    });

    it('should extract the suffix of a simple template literal', () => {
      const [, after] = cssAffixInterpolation('content: "', '";font-color:blue;');

      expect(after.variableSuffix).toEqual('"');
      expect(after.css).toEqual(';font-color:blue;');
    });

    it('should retain suffix with important flag', () => {
      const [, after] = cssAffixInterpolation('color: ', 'px !important;');

      expect(after.variableSuffix).toEqual('px');
      expect(after.css).toEqual(' !important;');
    });

    it('should ignore a space as prefix', () => {
      const [before] = cssAffixInterpolation('padding: 0 ', ' 0');

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual('padding: 0 ');
    });

    it('should ignore a space as suffix', () => {
      const [, after] = cssAffixInterpolation('padding: 0 ', ' 0');

      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(' 0');
    });

    it('should extract an interpolation that has a suffix', () => {
      const [, after] = cssAffixInterpolation('padding: 0 ', 'px 0');

      expect(after.variableSuffix).toEqual('px');
      expect(after.css).toEqual(' 0');
    });

    it('should extract the prefix of a complex template literal', () => {
      const [before] = cssAffixInterpolation('transform: translateX(', ');color:blue;');

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual('transform: translateX(');
    });

    it('should extract the suffix of a complex template literal', () => {
      const [, after] = cssAffixInterpolation('transform: translateX(', ');color:blue;');

      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(');color:blue;');
    });

    it('should extract first part of a three part value', () => {
      const [before] = cssAffixInterpolation('transform: transform3d(', ', ');

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual('transform: transform3d(');
    });

    it('should extract before second part of a three part value', () => {
      const [before] = cssAffixInterpolation(', ', ')');

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual(', ');
    });

    it('should extract after second part of a three part value', () => {
      const [, after] = cssAffixInterpolation('transform: transform3d(', ', ');

      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(', ');
    });

    it('should extract second part of a three part value', () => {
      const [, after] = cssAffixInterpolation(', ', ')');

      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(')');
    });

    it('should get the before and after for the first part of a transform interpolation', () => {
      const [before, after] = cssAffixInterpolation(`transform: translate3d(`, `px, `);

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual(`transform: translate3d(`);
      expect(after.variableSuffix).toEqual('px');
      expect(after.css).toEqual(', ');
    });

    it('should get the before and after for the second part of a transform interpolation', () => {
      const [before, after] = cssAffixInterpolation(
        `\n            transform: translate3d(var(--_test), `,
        `, 0);`
      );

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual('\n            transform: translate3d(var(--_test), ');
      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(', 0);');
    });
  });

  describe('interpolations with multiple groups', () => {
    it('should extract the first part of the first group', () => {
      const [before, after] = cssAffixInterpolation(
        'background-image: linear-gradient(45deg, ',
        ' 25%, transparent 25%),'
      );

      expect(before.css).toEqual('background-image: linear-gradient(45deg, ');
      expect(before.variablePrefix).toEqual('');
      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(' 25%, transparent 25%),');
    });

    it('should extract the first part of the second group', () => {
      const [before, after] = cssAffixInterpolation(
        'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%),',
        'linear-gradient(-45deg, '
      );

      expect(before.css).toEqual(
        'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%),'
      );
      expect(before.variablePrefix).toEqual('');
      expect(after.css).toEqual('linear-gradient(-45deg, ');
      expect(after.variableSuffix).toEqual('');
    });

    it('should extract the first part of the third group', () => {
      const [before, after] = cssAffixInterpolation(
        'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%), linear-gradient(-45deg, var(--_test) 25%, transparent 25%),',
        'linear-gradient(45deg, transparent 75%, '
      );

      expect(before.css).toEqual(
        'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%), linear-gradient(-45deg, var(--_test) 25%, transparent 25%),'
      );
      expect(before.variablePrefix).toEqual('');
      expect(after.css).toEqual('linear-gradient(45deg, transparent 75%, ');
      expect(after.variableSuffix).toEqual('');
    });

    it('should extract the first part of the fourth group', () => {
      const [before, after] = cssAffixInterpolation(
        'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%), linear-gradient(-45deg, var(--_test) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--_test) 75%),',
        'linear-gradient(-45deg, transparent 75%, '
      );

      expect(before.css).toEqual(
        'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%), linear-gradient(-45deg, var(--_test) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--_test) 75%),'
      );
      expect(before.variablePrefix).toEqual('');
      expect(after.css).toEqual('linear-gradient(-45deg, transparent 75%, ');
      expect(after.variableSuffix).toEqual('');
    });

    it('should move only minus to the prefix', () => {
      const [before] = cssAffixInterpolation('margin: 0 -', ';');

      expect(before.variablePrefix).toEqual('-');
      expect(before.css).toEqual('margin: 0 ');
    });

    it('should move whole prefix out', () => {
      const [before] = cssAffixInterpolation('font-size: "', 'big;');

      expect(before.variablePrefix).toEqual('"');
      expect(before.css).toEqual('font-size: ');
    });
  });

  describe('interpolations without surrounding css', () => {
    it('should extract the suffix with not prefix', () => {
      const [, after] = cssAffixInterpolation('', 'px;');

      expect(after.variableSuffix).toEqual('px');
      expect(after.css).toEqual(';');
    });

    it('should extract the prefix of a simple template literal', () => {
      const [before] = cssAffixInterpolation('"', '"');

      expect(before.variablePrefix).toEqual('"');
      expect(before.css).toEqual('');
    });

    it('should extract the suffix of a simple template literal', () => {
      const [, after] = cssAffixInterpolation('"', '";');

      expect(after.variableSuffix).toEqual('"');
      expect(after.css).toEqual(';');
    });

    it('should move whole prefix out', () => {
      const [before] = cssAffixInterpolation('"', 'big;');

      expect(before.variablePrefix).toEqual('"');
      expect(before.css).toEqual('');
    });

    it('should extract prefix from css calc function', () => {
      const [before] = cssAffixInterpolation('calc(100% - ', 'px)');

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual('calc(100% - ');
    });

    it('should extract suffix from css calc function', () => {
      const [, after] = cssAffixInterpolation('calc(100% - ', 'px)');

      expect(after.variableSuffix).toEqual('px');
      expect(after.css).toEqual(')');
    });

    it('should extract first part of a three part value', () => {
      const [before] = cssAffixInterpolation('transform3d(', ', ');

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual('transform3d(');
    });

    it('should extract before second part of a three part value', () => {
      const [before] = cssAffixInterpolation(', ', ')');

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual(', ');
    });

    it('should extract after second part of a three part value', () => {
      const [, after] = cssAffixInterpolation('transform3d(', ', ');

      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(', ');
    });

    it('should extract second part of a three part value', () => {
      const [, after] = cssAffixInterpolation(', ', ')');

      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(')');
    });

    it('should move only minus to the prefix', () => {
      const [before] = cssAffixInterpolation('0 -', ';');

      expect(before.variablePrefix).toEqual('-');
      expect(before.css).toEqual('0 ');
    });
  });

  describe('interpolations with url', () => {
    it('should handle single url', () => {
      const [before, after] = cssAffixInterpolation('background-image: url(', ')');

      expect(before.css).toEqual('background-image: ');
      expect(before.variablePrefix).toEqual('url(');
      expect(after.variableSuffix).toEqual(')');
      expect(after.css).toEqual('');
    });

    it('should handle multiple urls', () => {
      const [before, after] = cssAffixInterpolation('background-image: url(', '), url(');

      expect(before).toMatchObject({
        css: 'background-image: ',
        variablePrefix: 'url(',
      });
      expect(after).toMatchObject({
        css: ', url(',
        variablePrefix: ')',
      });
    });
  });
});
