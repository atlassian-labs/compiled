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

      const ThemeProvider = createThemeProvider();
    `,
      { tokens }
    );

    expect(actual).not.toInclude(`import { createThemeProvider } from '@compiled/css-in-js';`);
  });

  it('should not duplicate tokens object', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      const Thing = {};

      if (true) {
        Thing.ok = true;
      }

      const hello = 'true';

      const ThemeProvider = createThemeProvider();
    `,
      { tokens }
    );

    expect(actual).toIncludeRepeated(
      'const tokens = { "default": { "--cc-1tivpv1": "#0052CC" } }',
      1
    );
  });

  it('should ensure compiled theme is imported', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      const ThemeProvider = createThemeProvider();
      `,
      { tokens }
    );

    expect(actual).toInclude(`import { CT } from '@compiled/css-in-js';`);
  });

  it('should replace function call with compiled provider', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      const { ThemeProvider } = createThemeProvider();
      `,
      { tokens }
    );

    expect(actual).not.toInclude('createThemeProvider()');
    expect(actual).toInclude(
      `const { ThemeProvider } = { theme: { primary: \"var(--cc-1tivpv1,#0052CC)\" }, ThemeProvider: props => (<CT {...props}>{props.children(tokens[props.mode])}</CT>) };`
    );
  });

  it('should build up token themes using base', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      const ThemeProvider = createThemeProvider();
      `,
      { tokens }
    );

    expect(actual).toInclude('const tokens = { "default": { "--cc-1tivpv1": "#0052CC" } }');
  });

  it('should build a theme object from the tokens json', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      const ThemeProvider = createThemeProvider();
      `,
      { tokens }
    );

    expect(actual).toInclude('theme: { primary: "var(--cc-1tivpv1,#0052CC)" }');
  });

  it('should inline theme usage', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      const { theme } = createThemeProvider();

      const primary = theme.primary;
      `,
      { tokens }
    );

    expect(actual).toInclude('const primary = "var(--cc-1tivpv1,#0052CC)"');
  });
});
