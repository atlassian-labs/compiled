import { cssBeforeInterpolation, cssAfterInterpolation } from '../template-literal-to-css';

describe('template literal to css', () => {
  describe('interpolations with surrounding css', () => {
    it('should extract the prefix of a simple template literal', () => {
      const simpleParts = ['content: "', '";font-color:blue;'];

      const head = cssBeforeInterpolation(simpleParts[0]);

      expect(head.variablePrefix).toEqual('"');
      expect(head.css).toEqual('content: ');
    });

    it('should extract the suffix of a simple template literal', () => {
      const simpleParts = ['content: "', '";font-color:blue;'];

      const head = cssAfterInterpolation(simpleParts[1]);

      expect(head.variableSuffix).toEqual('"');
      expect(head.css).toEqual(';font-color:blue;');
    });

    it('should extract the prefix of a complex template literal', () => {
      const complexParts = ['transform: translateX(', ');color:blue;'];

      const head = cssBeforeInterpolation(complexParts[0]);

      expect(head.variablePrefix).toEqual(undefined);
      expect(head.css).toEqual('transform: translateX(');
    });

    it('should extract the suffix of a complex template literal', () => {
      const complexParts = ['transform: translateX(', ');color:blue;'];

      const head = cssAfterInterpolation(complexParts[1]);

      expect(head.variableSuffix).toEqual('');
      expect(head.css).toEqual(');color:blue;');
    });
  });

  describe('interpolations without surrounding css', () => {
    it('should extract the suffix with not prefix', () => {
      const simpleParts = ['px'];

      const head = cssAfterInterpolation(simpleParts[0]);

      expect(head.variableSuffix).toEqual('px');
      expect(head.css).toEqual('');
    });

    it('should extract the prefix of a simple template literal', () => {
      const simpleParts = ['"', '"'];

      const head = cssBeforeInterpolation(simpleParts[0]);

      expect(head.variablePrefix).toEqual('"');
      expect(head.css).toEqual('');
    });

    it('should extract the suffix of a simple template literal', () => {
      const simpleParts = ['"', '"'];

      const head = cssAfterInterpolation(simpleParts[1]);

      expect(head.variableSuffix).toEqual('"');
      expect(head.css).toEqual('');
    });

    it('should extract prefix from css calac function', () => {
      const complexPartsNoPropertyName = ['calc(100% - ', 'px)'];

      const head = cssBeforeInterpolation(complexPartsNoPropertyName[0]);

      expect(head.variablePrefix).toEqual(undefined);
      expect(head.css).toEqual('calc(100% - ');
    });

    it('should extract suffix from css calc function', () => {
      const complexPartsNoPropertyName = ['calc(100% - ', 'px)'];

      const head = cssAfterInterpolation(complexPartsNoPropertyName[1]);

      expect(head.variableSuffix).toEqual('px');
      expect(head.css).toEqual(')');
    });
  });
});
