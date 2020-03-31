import * as ts from 'typescript';
import { Transformer } from 'ts-transformer-testing-library';
import rootTransformer from '../index';

const stubProgam: ts.Program = ({
  getTypeChecker: () => ({
    getSymbolAtLocation: () => undefined,
  }),
} as never) as ts.Program;

describe('root transformer', () => {
  it('should not blow up when transforming with const', () => {
    const transformer = rootTransformer(stubProgam, {});

    expect(() => {
      ts.transpileModule(
        `
          /** @jsx jsx */
          import { jsx } from '@compiled/css-in-js';
          const MyComponent = () => <div css={{ fontSize: '20px' }}>hello world</div>
        `,
        {
          transformers: { before: [transformer] },
          compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React },
        }
      );
    }).not.toThrow();
  });

  it('should not blow up when transforming with var', () => {
    const transformer = rootTransformer(stubProgam, {});

    expect(() => {
      ts.transpileModule(
        `
          /** @jsx jsx */
          import { jsx } from '@compiled/css-in-js';
          var MyComponent = () => <div css={{ fontSize: '20px' }}>hello world</div>
        `,
        {
          transformers: { before: [transformer] },
          compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React },
        }
      );
    }).not.toThrow();
  });

  it('should not blow up when consuming an import', () => {
    const transformer = new Transformer()
      .addTransformer(rootTransformer)
      .setFilePath('/index.tsx')
      .addMock({ name: '@compiled/css-in-js', content: `export const jsx: any = () => null` })
      .addSource({
        path: '/mixins.ts',
        contents: "export const mixin = { color: 'blue' };",
      });

    expect(() => {
      transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        import { mixin } from './mixins';

        <div css={{ ':hover': mixin }}>hello</div>
      `);
    }).not.toThrow();
  });

  it('should only import Style once', () => {
    const transformer = rootTransformer(stubProgam, {});

    const actual = ts.transpileModule(
      `
        /** @jsx jsx */
        import { jsx, styled } from '@compiled/css-in-js';

        const StyledDiv = styled.div({});
        <div css={{ fontSize: '20px' }}>hello world</div>
      `,
      {
        transformers: { before: [transformer] },
        compilerOptions: {
          module: ts.ModuleKind.ES2015,
          esModuleInterop: true,
          jsx: ts.JsxEmit.React,
        },
      }
    );

    expect(actual.outputText).toInclude("import { Style, jsx, styled } from '@compiled/css-in-js'");
  });

  xit('should match react import when transforming to common js', () => {
    const transformer = rootTransformer(stubProgam, {});

    const actual = ts.transpileModule(
      `
        /** @jsx jsx */
        import { jsx } from '@compiled/css-in-js';
        <div css={{ fontSize: '20px' }}>hello world</div>
      `,
      {
        transformers: { before: [transformer] },
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          esModuleInterop: true,
          jsx: ts.JsxEmit.React,
        },
      }
    );

    expect(actual.outputText).toInclude('var react_1 = __importDefault(require("react"));');
    expect(actual.outputText).toInclude('react_1.createElement');
    expect(actual.outputText).not.toInclude('React.createElement');
  });
});
