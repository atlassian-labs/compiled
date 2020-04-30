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

    expect(actual).toInclude('color:#0052CC;color:var(--cc-1tivpv1)');
  });

  it('should use a defined token prefix', () => {
    const actual = transpileModule(
      `
        import '@compiled/css-in-js';

        <div css={{ color: 'theme(primary)' }}>hello world</div>
      `,
      {
        tokenPrefix: 'atl',
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

    expect(actual).toInclude('color:var(--atl-1tivpv1)');
  });

  it('should block hardcoded color use if in strict mode', () => {
    expect(() =>
      transpileModule(
        `
        import '@compiled/css-in-js';

        <div css={{ color: '#ccc' }}>hello world</div>
      `,
        {
          tokenPrefix: 'atl',
          strict: true,
          tokens: {
            base: {
              b400: '#0052CC',
            },
            default: {
              primary: 'b400',
            },
          },
        }
      )
    ).toThrow();
  });

  it('should suggest token if exact match was found', () => {
    expect(() =>
      transpileModule(
        `
        import '@compiled/css-in-js';

        <div css={{ color: '#0052CC' }}>hello world</div>
      `,
        {
          tokenPrefix: 'atl',
          strict: true,
          tokens: {
            base: {
              b400: '#0052CC',
            },
            default: {
              primary: 'b400',
            },
          },
        }
      )
    ).toThrowError(
      new Error(`You've defined hard-coded colors which is not allowed in strict mode.
\"color: #0052CC;\" - replace #0052CC with theme(primary).`)
    );
  });

  it('should pick up tokens from a supplied relative path', () => {
    const actual = transpileModule(
      `
        import '@compiled/css-in-js';

        <div css={{ color: 'theme(primary)' }}>hello world</div>
      `,
      {
        tokens: './test/tokens.json',
      }
    );

    expect(actual).toInclude('color:#0052CC');
  });

  it('should pick up tokens from a supplied package', () => {
    const actual = transpileModule(
      `
        import '@compiled/css-in-js';

        <div css={{ color: 'theme(primary)' }}>hello world</div>
      `,
      {
        tokens: './test/tokens.json',
      }
    );

    expect(actual).toInclude('color:#0052CC');
  });

  it('should resolve tokens from package entry', () => {
    const actual = transpileModule(
      `
        import '@compiled/css-in-js';

        <div css={{ color: 'theme(primary)' }}>hello world</div>
      `,
      {
        tokens: 'tokens-pkg',
      }
    );

    expect(actual).toInclude('color:#0052CC');
  });

  it('should resolve tokens from package file', () => {
    const actual = transpileModule(
      `
        import '@compiled/css-in-js';

        <div css={{ color: 'theme(primary)' }}>hello world</div>
      `,
      {
        tokens: 'tokens-pkg/tokens.json',
      }
    );

    expect(actual).toInclude('color:#0052CC');
  });
});
