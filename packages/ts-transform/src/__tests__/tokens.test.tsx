import * as ts from 'typescript';
import transformer, { TransformerOptions } from '../index';

const stubProgram: ts.Program = ({
  getTypeChecker: () => ({
    getSymbolAtLocation: () => undefined,
  }),
} as never) as ts.Program;

const transpileModule = (source: string, opts: TransformerOptions = {}) => {
  return ts.transpileModule(source, {
    transformers: { before: [transformer(stubProgram, { options: opts })] },
    compilerOptions: {
      module: ts.ModuleKind.ES2015,
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.ESNext,
    },
  }).outputText;
};

describe('tokens', () => {
  it('should use a value from declared tokens', () => {
    const actual = transpileModule(
      `
        import '@compiled/css-in-js';

        <div css={{ color: 'theme(primary)' }}>hello world</div>
      `,
      {
        tokenPrefix: 'ak',
        tokens: {
          base: {
            b400: '#0052CC',
          },
          default: {
            primary: 'b400',
          },
        },
      }
    );

    expect(actual).toInclude('color:#0052CC');
  });
});
