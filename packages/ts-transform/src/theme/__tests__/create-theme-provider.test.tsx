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

  it('should bail out if its referencing something that doesnt exist', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      const { theme } = createThemeProvider();

      const primary = theme.dontexist;
      `,
      { tokens }
    );

    expect(actual).toInclude('const primary = theme.dontexist;');
  });

  it('should flatten nested themes', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      const { theme } = createThemeProvider();
      `,
      {
        tokens: {
          base: {
            b400: '#0052CC',
            n0: '#fff',
          },
          default: {
            borderRadius: '3px',
            colors: {
              primary: 'b400',
              card: {
                background: 'n0',
              },
            },
          },
        },
      }
    );

    expect(actual).toInclude(
      '"default": { "--cc-1lnby5": "3px", "--cc-1bya7p6": "#0052CC", "--cc-1rqna7t": "#fff" }'
    );
  });

  it('should build up nested themes object for consumer use', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      const { theme } = createThemeProvider();
      `,
      {
        tokens: {
          base: {
            b400: '#0052CC',
            n0: '#fff',
          },
          default: {
            borderRadius: '3px',
            colors: {
              primary: 'b400',
              card: {
                background: 'n0',
              },
            },
          },
        },
      }
    );

    expect(actual).toInclude(
      'theme: { borderRadius: "var(--cc-1lnby5)", colors: { primary: "var(--cc-1bya7p6,#0052CC)", card: { background: "var(--cc-1rqna7t,#fff)" } }'
    );
  });

  it('should inline nested theme reference', () => {
    const actual = transpileModule(
      `
      import { createThemeProvider } from '@compiled/css-in-js';

      const { theme } = createThemeProvider();

      const background = theme.colors.card.background;
      `,
      {
        tokens: {
          base: {
            b400: '#0052CC',
            n0: '#fff',
          },
          default: {
            borderRadius: '3px',
            colors: {
              primary: 'b400',
              card: {
                background: 'n0',
              },
            },
          },
        },
      }
    );

    expect(actual).toInclude('const background = "var(--cc-1rqna7t,#fff)";');
  });
});
