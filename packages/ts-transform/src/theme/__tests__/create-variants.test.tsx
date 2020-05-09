import * as ts from 'typescript';
import transformer from '../index';
import { TransformerOptions, Tokens } from '../../types';

const stubProgram: ts.Program = ({
  getTypeChecker: () => ({
    getSymbolAtLocation: () => undefined,
  }),
} as never) as ts.Program;

const transpileModule = (source: string, opts: TransformerOptions = {}) => {
  return ts.transpileModule(source, {
    transformers: { before: [transformer(stubProgram, opts)] },
    compilerOptions: {
      module: ts.ModuleKind.ES2015,
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.ESNext,
    },
  }).outputText;
};

describe('create theme provider', () => {
  const tokens: Tokens = {
    base: {
      b100: '#4c9aff',
      b400: '#0052CC',
      n100a: '#091e420a',
      n40: '#DFE1E6',
      n400: '#505F79',
      n500: '#42526e',
      n600: '#344563',
      n0: '#fff',
    },
    default: {
      primary: 'b400',
    },
    dark: {
      primary: 'b100',
    },
  };

  const variantsCode = `
  import { createVariants } from '@compiled/css-in-js';

  const useVariants = createVariants({
    default: { default: { color: 'n500', backgroundColor: 'n100a' }, dark: { color: 'n40', backgroundColor: 'n400' } },
    primary: { default: { color: 'n0', backgroundColor: 'primary' }, dark: { color: 'n600 } },
  });
`;

  it('should remove theme import', () => {
    const actual = transpileModule(variantsCode, { tokens });

    expect(actual).not.toInclude(`createVariants }`);
  });

  it('should transform create variants into variant hook', () => {
    const actual = transpileModule(variantsCode, { tokens });

    expect(actual).toInclude(`
const useVariants = variant => {
    const mode = useMode();
    const defaultVariant = variants.default;
    return {
        ...defaultVariant.default,
        ...defaultVariant[mode],
        ...variants[variant][mode]
    };
};`);
  });

  it('should build variants object', () => {
    const actual = transpileModule(variantsCode, { tokens });

    expect(actual).toInclude('bleh');
  });
});
