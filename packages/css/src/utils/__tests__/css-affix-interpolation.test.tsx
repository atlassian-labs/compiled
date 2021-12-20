import { cssAffixInterpolation } from '../css-affix-interpolation';

describe('cssAffixInterpolation', () => {
  describe('interpolations with surrounding css', () => {
    it('should extract the prefix of a simple template literal', () => {
      const [before] = cssAffixInterpolation('content: "', '";font-color:blue;');

      expect(before).toEqual({
        css: 'content: ',
        variablePrefix: '"',
      });
    });

    it('should extract the suffix of a simple template literal', () => {
      const [, after] = cssAffixInterpolation('content: "', '";font-color:blue;');

      expect(after).toEqual({
        css: ';font-color:blue;',
        variableSuffix: '"',
      });
    });

    it('should retain suffix with important flag', () => {
      const [, after] = cssAffixInterpolation('color: ', 'px !important;');

      expect(after).toEqual({
        css: ' !important;',
        variableSuffix: 'px',
      });
    });

    it('should ignore a space as prefix', () => {
      const [before] = cssAffixInterpolation('padding: 0 ', ' 0');

      expect(before).toEqual({
        css: 'padding: 0 ',
        variablePrefix: '',
      });
    });

    it('should ignore a space as suffix', () => {
      const [, after] = cssAffixInterpolation('padding: 0 ', ' 0');

      expect(after).toEqual({
        css: ' 0',
        variableSuffix: '',
      });
    });

    it('should extract an interpolation that has a suffix', () => {
      const [, after] = cssAffixInterpolation('padding: 0 ', 'px 0');

      expect(after).toEqual({
        css: ' 0',
        variableSuffix: 'px',
      });
    });

    it('should extract the prefix of a complex template literal', () => {
      const [before] = cssAffixInterpolation('transform: translateX(', ');color:blue;');

      expect(before).toEqual({
        css: 'transform: translateX(',
        variablePrefix: '',
      });
    });

    it('should extract the suffix of a complex template literal', () => {
      const [, after] = cssAffixInterpolation('transform: translateX(', ');color:blue;');

      expect(after).toEqual({
        css: ');color:blue;',
        variableSuffix: '',
      });
    });

    it('should extract first part of a three part value', () => {
      const [before] = cssAffixInterpolation('transform: transform3d(', ', ');

      expect(before).toEqual({
        css: 'transform: transform3d(',
        variablePrefix: '',
      });
    });

    it('should extract before second part of a three part value', () => {
      const [before] = cssAffixInterpolation(', ', ')');

      expect(before).toEqual({
        css: ', ',
        variablePrefix: '',
      });
    });

    it('should extract after second part of a three part value', () => {
      const [, after] = cssAffixInterpolation('transform: transform3d(', ', ');

      expect(after).toEqual({
        css: ', ',
        variableSuffix: '',
      });
    });

    it('should extract second part of a three part value', () => {
      const [, after] = cssAffixInterpolation(', ', ')');

      expect(after).toEqual({
        css: ')',
        variableSuffix: '',
      });
    });

    it('should get the before and after for the first part of a transform interpolation', () => {
      const [before, after] = cssAffixInterpolation(`transform: translate3d(`, `px, `);

      expect(before).toEqual({
        css: `transform: translate3d(`,
        variablePrefix: '',
      });
      expect(after).toEqual({
        css: ', ',
        variableSuffix: 'px',
      });
    });

    it('should get the before and after for the second part of a transform interpolation', () => {
      const [before, after] = cssAffixInterpolation(
        `\n            transform: translate3d(var(--_test), `,
        `, 0);`
      );

      expect(before).toEqual({
        css: '\n            transform: translate3d(var(--_test), ',
        variablePrefix: '',
      });
      expect(after).toEqual({
        css: ', 0);',
        variableSuffix: '',
      });
    });
  });

  describe('interpolations with multiple groups', () => {
    it('should extract the first part of the first group', () => {
      const [before, after] = cssAffixInterpolation(
        'background-image: linear-gradient(45deg, ',
        ' 25%, transparent 25%),'
      );

      expect(before).toEqual({
        css: 'background-image: linear-gradient(45deg, ',
        variablePrefix: '',
      });
      expect(after).toEqual({
        css: ' 25%, transparent 25%),',
        variableSuffix: '',
      });
    });

    it('should extract the first part of the second group', () => {
      const [before, after] = cssAffixInterpolation(
        'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%),',
        'linear-gradient(-45deg, '
      );

      expect(before).toEqual({
        css: 'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%),',
        variablePrefix: '',
      });
      expect(after).toEqual({
        css: 'linear-gradient(-45deg, ',
        variableSuffix: '',
      });
    });

    it('should extract the first part of the third group', () => {
      const [before, after] = cssAffixInterpolation(
        'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%), linear-gradient(-45deg, var(--_test) 25%, transparent 25%),',
        'linear-gradient(45deg, transparent 75%, '
      );

      expect(before).toEqual({
        css: 'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%), linear-gradient(-45deg, var(--_test) 25%, transparent 25%),',
        variablePrefix: '',
      });
      expect(after).toEqual({
        css: 'linear-gradient(45deg, transparent 75%, ',
        variableSuffix: '',
      });
    });

    it('should extract the first part of the fourth group', () => {
      const [before, after] = cssAffixInterpolation(
        'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%), linear-gradient(-45deg, var(--_test) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--_test) 75%),',
        'linear-gradient(-45deg, transparent 75%, '
      );

      expect(before).toEqual({
        css: 'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%), linear-gradient(-45deg, var(--_test) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--_test) 75%),',
        variablePrefix: '',
      });
      expect(after).toEqual({
        css: 'linear-gradient(-45deg, transparent 75%, ',
        variableSuffix: '',
      });
    });

    it('should move only minus to the prefix', () => {
      const [before] = cssAffixInterpolation('margin: 0 -', ';');

      expect(before).toEqual({
        css: 'margin: 0 ',
        variablePrefix: '-',
      });
    });

    it('should move whole prefix out', () => {
      const [before] = cssAffixInterpolation('font-size: "', 'big;');

      expect(before).toEqual({
        css: 'font-size: ',
        variablePrefix: '"',
      });
    });
  });

  describe('interpolations without surrounding css', () => {
    it('should extract the suffix with not prefix', () => {
      const [, after] = cssAffixInterpolation('', 'px;');

      expect(after).toEqual({
        css: ';',
        variableSuffix: 'px',
      });
    });

    it('should extract the prefix of a simple template literal', () => {
      const [before] = cssAffixInterpolation('"', '"');

      expect(before).toEqual({
        css: '',
        variablePrefix: '"',
      });
    });

    it('should extract the suffix of a simple template literal', () => {
      const [, after] = cssAffixInterpolation('"', '";');

      expect(after).toEqual({
        css: ';',
        variableSuffix: '"',
      });
    });

    it('should move whole prefix out', () => {
      const [before] = cssAffixInterpolation('"', 'big;');

      expect(before).toEqual({
        css: '',
        variablePrefix: '"',
      });
    });

    it('should extract prefix from css calc function', () => {
      const [before] = cssAffixInterpolation('calc(100% - ', 'px)');

      expect(before).toEqual({
        css: 'calc(100% - ',
        variablePrefix: '',
      });
    });

    it('should extract suffix from css calc function', () => {
      const [, after] = cssAffixInterpolation('calc(100% - ', 'px)');

      expect(after).toEqual({
        css: ')',
        variableSuffix: 'px',
      });
    });

    it('should extract first part of a three part value', () => {
      const [before] = cssAffixInterpolation('transform3d(', ', ');

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual('transform3d(');
    });

    it('should extract before second part of a three part value', () => {
      const [before] = cssAffixInterpolation(', ', ')');

      expect(before).toEqual({
        css: ', ',
        variablePrefix: '',
      });
    });

    it('should extract after second part of a three part value', () => {
      const [, after] = cssAffixInterpolation('transform3d(', ', ');

      expect(after).toEqual({
        css: ', ',
        variableSuffix: '',
      });
    });

    it('should extract second part of a three part value', () => {
      const [, after] = cssAffixInterpolation(', ', ')');

      expect(after).toEqual({
        css: ')',
        variableSuffix: '',
      });
    });

    it('should move only minus to the prefix', () => {
      const [before] = cssAffixInterpolation('0 -', ';');

      expect(before).toEqual({
        css: '0 ',
        variablePrefix: '-',
      });
    });
  });

  describe('interpolations with url', () => {
    it('should handle single url', () => {
      const [before, after] = cssAffixInterpolation('background-image: url(', ')');

      expect(before).toEqual({
        css: 'background-image: ',
        variablePrefix: 'url(',
      });
      expect(after).toEqual({
        css: '',
        variableSuffix: ')',
      });
    });

    it('should handle multiple urls', () => {
      const [before, after] = cssAffixInterpolation('background-image: url(', '), url(');

      expect(before).toEqual({
        css: 'background-image: ',
        variablePrefix: 'url(',
      });
      expect(after).toEqual({
        css: ', url(',
        variableSuffix: ')',
      });
    });
  });
});
