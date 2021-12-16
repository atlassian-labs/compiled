import { cssAffixInterpolation } from '../string-interpolations';

describe('template literal to css', () => {
  describe('interpolations with surrounding css', () => {
    it('should extract the prefix of a simple template literal', () => {
      const simpleParts = ['content: "', '";font-color:blue;'];

      const [before] = cssAffixInterpolation(simpleParts[0], simpleParts[1]);

      expect(before.variablePrefix).toEqual('"');
      expect(before.css).toEqual('content: ');
    });

    it('should extract the suffix of a simple template literal', () => {
      const simpleParts = ['content: "', '";font-color:blue;'];

      const [, after] = cssAffixInterpolation(simpleParts[0], simpleParts[1]);

      expect(after.variableSuffix).toEqual('"');
      expect(after.css).toEqual(';font-color:blue;');
    });

    it('should retain suffix with important flag', () => {
      const simpleParts = ['color: ', 'px !important;'];

      const [, after] = cssAffixInterpolation(simpleParts[0], simpleParts[1]);

      expect(after.variableSuffix).toEqual('px');
      expect(after.css).toEqual(' !important;');
    });

    it('should ignore a space as prefix', () => {
      const simpleParts = ['padding: 0 ', ' 0'];

      const [before] = cssAffixInterpolation(simpleParts[0], simpleParts[1]);

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual('padding: 0 ');
    });

    it('should ignore a space as suffix', () => {
      const simpleParts = ['padding: 0 ', ' 0'];

      const [, after] = cssAffixInterpolation(simpleParts[0], simpleParts[1]);

      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(' 0');
    });

    it('should extract an interpolation that has a suffix', () => {
      const simpleParts = ['padding: 0 ', 'px 0'];

      const [, after] = cssAffixInterpolation(simpleParts[0], simpleParts[1]);

      expect(after.variableSuffix).toEqual('px');
      expect(after.css).toEqual(' 0');
    });

    it('should extract the prefix of a complex template literal', () => {
      const complexParts = ['transform: translateX(', ');color:blue;'];

      const [before] = cssAffixInterpolation(complexParts[0], complexParts[1]);

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual('transform: translateX(');
    });

    it('should extract the suffix of a complex template literal', () => {
      const complexParts = ['transform: translateX(', ');color:blue;'];

      const [, after] = cssAffixInterpolation(complexParts[0], complexParts[1]);

      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(');color:blue;');
    });

    it('should extract first part of a three part value', () => {
      const complexPartsNoPropertyName = ['transform: transform3d(', ', ', ')'];

      const [before] = cssAffixInterpolation(
        complexPartsNoPropertyName[0],
        complexPartsNoPropertyName[1]
      );

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual('transform: transform3d(');
    });

    it('should extract before second part of a three part value', () => {
      const complexPartsNoPropertyName = ['transform: transform3d(', ', ', ')'];

      const [before] = cssAffixInterpolation(
        complexPartsNoPropertyName[1],
        complexPartsNoPropertyName[2]
      );

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual(', ');
    });

    it('should extract after second part of a three part value', () => {
      const complexPartsNoPropertyName = ['transform: transform3d(', ', ', ')'];

      const [, after] = cssAffixInterpolation(
        complexPartsNoPropertyName[0],
        complexPartsNoPropertyName[1]
      );

      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(', ');
    });

    it('should extract second part of a three part value', () => {
      const complexPartsNoPropertyName = ['transform: transform3d(', ', ', ')'];

      const [, after] = cssAffixInterpolation(
        complexPartsNoPropertyName[1],
        complexPartsNoPropertyName[2]
      );

      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(')');
    });

    it('should get the before and after for the first part of a transform interpolation', () => {
      const css = [`transform: translate3d(`, `px, `, `, 0);`];

      const [before, after] = cssAffixInterpolation(css[0], css[1]);

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual(css[0]);
      expect(after.variableSuffix).toEqual('px');
      expect(after.css).toEqual(', ');
    });

    it('should get the before and after for the second part of a transform interpolation', () => {
      const css = [`\n            transform: translate3d(var(--_test), `, `, 0);`];

      const [before, after] = cssAffixInterpolation(css[0], css[1]);

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual('\n            transform: translate3d(var(--_test), ');
      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(', 0);');
    });
  });

  describe('interpolations with multiple groups', () => {
    it('should extract the first part of the first group', () => {
      const parts = [
        'background-image: linear-gradient(45deg, ',
        ' 25%, transparent 25%),',
        'linear-gradient(-45deg, ',
        ' 25%, transparent 25%),',
        'linear-gradient(45deg, transparent 75%, ',
        ' 75%),',
        'linear-gradient(-45deg, transparent 75%, ',
        ' 75%);',
      ];

      const [before, after] = cssAffixInterpolation(parts[0], parts[1]);

      expect(before.css).toEqual(parts[0]);
      expect(before.variablePrefix).toEqual('');
      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(parts[1]);
    });

    it('should extract the first part of the second group', () => {
      const parts = [
        'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%),',
        'linear-gradient(-45deg, ',
        ' 25%, transparent 25%),',
        'linear-gradient(45deg, transparent 75%, ',
        ' 75%),',
        'linear-gradient(-45deg, transparent 75%, ',
        ' 75%);',
      ];

      const [before, after] = cssAffixInterpolation(parts[0], parts[1]);

      expect(before.css).toEqual(parts[0]);
      expect(before.variablePrefix).toEqual('');
      expect(after.css).toEqual(parts[1]);
      expect(after.variableSuffix).toEqual('');
    });

    it('should extract the first part of the third group', () => {
      const parts = [
        'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%), linear-gradient(-45deg, var(--_test) 25%, transparent 25%),',
        'linear-gradient(45deg, transparent 75%, ',
        ' 75%),',
        'linear-gradient(-45deg, transparent 75%, ',
        ' 75%);',
      ];

      const [before, after] = cssAffixInterpolation(parts[0], parts[1]);

      expect(before.css).toEqual(parts[0]);
      expect(before.variablePrefix).toEqual('');
      expect(after.css).toEqual(parts[1]);
      expect(after.variableSuffix).toEqual('');
    });

    it('should extract the first part of the fourth group', () => {
      const parts = [
        'background-image: linear-gradient(45deg, var(--_test) 25%, transparent 25%), linear-gradient(-45deg, var(--_test) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--_test) 75%),',
        'linear-gradient(-45deg, transparent 75%, ',
        ' 75%);',
      ];

      const [before, after] = cssAffixInterpolation(parts[0], parts[1]);

      expect(before.css).toEqual(parts[0]);
      expect(before.variablePrefix).toEqual('');
      expect(after.css).toEqual(parts[1]);
      expect(after.variableSuffix).toEqual('');
    });

    it('should move only minus to the prefix', () => {
      const simpleParts = ['margin: 0 -', ';'];

      const [before] = cssAffixInterpolation(simpleParts[0], simpleParts[1]);

      expect(before.variablePrefix).toEqual('-');
      expect(before.css).toEqual('margin: 0 ');
    });

    it('should move whole prefix out', () => {
      const simpleParts = ['font-size: "', 'big;'];

      const [before] = cssAffixInterpolation(simpleParts[0], simpleParts[1]);

      expect(before.variablePrefix).toEqual('"');
      expect(before.css).toEqual('font-size: ');
    });
  });

  describe('interpolations without surrounding css', () => {
    it('should extract the suffix with not prefix', () => {
      const simpleParts = ['', 'px;'];

      const [, after] = cssAffixInterpolation(simpleParts[0], simpleParts[1]);

      expect(after.variableSuffix).toEqual('px');
      expect(after.css).toEqual(';');
    });

    it('should extract the prefix of a simple template literal', () => {
      const simpleParts = ['"', '"'];

      const [before] = cssAffixInterpolation(simpleParts[0], simpleParts[1]);

      expect(before.variablePrefix).toEqual('"');
      expect(before.css).toEqual('');
    });

    it('should extract the suffix of a simple template literal', () => {
      const simpleParts = ['"', '";'];

      const [, after] = cssAffixInterpolation(simpleParts[0], simpleParts[1]);

      expect(after.variableSuffix).toEqual('"');
      expect(after.css).toEqual(';');
    });

    it('should move whole prefix out', () => {
      const simpleParts = ['"', 'big;'];

      const [before] = cssAffixInterpolation(simpleParts[0], simpleParts[1]);

      expect(before.variablePrefix).toEqual('"');
      expect(before.css).toEqual('');
    });

    it('should extract prefix from css calc function', () => {
      const complexPartsNoPropertyName = ['calc(100% - ', 'px)'];

      const [before] = cssAffixInterpolation(
        complexPartsNoPropertyName[0],
        complexPartsNoPropertyName[1]
      );

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual('calc(100% - ');
    });

    it('should extract suffix from css calc function', () => {
      const complexPartsNoPropertyName = ['calc(100% - ', 'px)'];

      const [, after] = cssAffixInterpolation(
        complexPartsNoPropertyName[0],
        complexPartsNoPropertyName[1]
      );

      expect(after.variableSuffix).toEqual('px');
      expect(after.css).toEqual(')');
    });

    it('should extract first part of a three part value', () => {
      const complexPartsNoPropertyName = ['transform3d(', ', ', ')'];

      const [before] = cssAffixInterpolation(
        complexPartsNoPropertyName[0],
        complexPartsNoPropertyName[1]
      );

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual('transform3d(');
    });

    it('should extract before second part of a three part value', () => {
      const complexPartsNoPropertyName = ['transform3d(', ', ', ')'];

      const [before] = cssAffixInterpolation(
        complexPartsNoPropertyName[1],
        complexPartsNoPropertyName[2]
      );

      expect(before.variablePrefix).toEqual('');
      expect(before.css).toEqual(', ');
    });

    it('should extract after second part of a three part value', () => {
      const complexPartsNoPropertyName = ['transform3d(', ', ', ')'];

      const [, after] = cssAffixInterpolation(
        complexPartsNoPropertyName[0],
        complexPartsNoPropertyName[1]
      );

      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(', ');
    });

    it('should extract second part of a three part value', () => {
      const complexPartsNoPropertyName = ['transform3d(', ', ', ')'];

      const [, after] = cssAffixInterpolation(
        complexPartsNoPropertyName[1],
        complexPartsNoPropertyName[2]
      );

      expect(after.variableSuffix).toEqual('');
      expect(after.css).toEqual(')');
    });

    it('should move only minus to the prefix', () => {
      const simpleParts = ['0 -', ';'];

      const [before] = cssAffixInterpolation(simpleParts[0], simpleParts[1]);

      expect(before.variablePrefix).toEqual('-');
      expect(before.css).toEqual('0 ');
    });
  });

  describe('interpolations with url', () => {
    it('should handle single url', () => {
      const parts = ['background-image: url(', ')'];

      const [before, after] = cssAffixInterpolation(parts[0], parts[1]);

      expect(before.css).toEqual('background-image: ');
      expect(before.variablePrefix).toEqual('url(');
      expect(after.variableSuffix).toEqual(')');
      expect(after.css).toEqual('');
    });

    it('should handle multiple urls', () => {
      const parts = ['background-image: url(', '), url(', ');'];

      const [before, after] = cssAffixInterpolation(parts[0], parts[1]);

      expect(before.css).toEqual('background-image: ');
      expect(before.variablePrefix).toEqual('url(');
      expect(after.variableSuffix).toEqual(')');
      expect(after.css).toEqual(', url(');
    });
  });
});
