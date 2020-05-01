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
      b400: '#0052CC',
    },
    default: {
      primary: 'b400',
    },
  };

  it('should remove theme import', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      createThemeProvider();
    `,
      { tokens }
    );

    expect(actual).not.toInclude(`import { createThemeProvider } from '@compiled/css-in-js';`);
  });

  it('should ensure compiled theme is imported', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      createThemeProvider();
      `,
      { tokens }
    );

    expect(actual).toInclude(`import { CT } from '@compiled/css-in-js';`);
  });

  it('should replace function call with compiled provider', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      createThemeProvider();
      `,
      { tokens }
    );

    expect(actual).not.toInclude('createThemeProvider()');
    expect(actual).toInclude(
      `props => (<CT {...props}>{props.children(tokens[props.mode])}</CT>);`
    );
  });

  it('should build up token themes using base', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      createThemeProvider();
      `,
      { tokens }
    );

    expect(actual).toInclude('const tokens = { "default": { "--cc-1tivpv1": "#0052CC" } }');
  });
});
