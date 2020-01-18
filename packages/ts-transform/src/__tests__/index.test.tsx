import * as ts from 'typescript';
import { Transformer } from 'ts-transformer-testing-library';
import rootTransformer from '../index';
import pkg from '../../../../package.json';

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
          import { jsx } from '${pkg.name}';
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
          import { jsx } from '${pkg.name}';
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
      .addMock({ name: pkg.name, content: `export const jsx: any = () => null` })
      .addSource({
        path: '/mixins.ts',
        contents: "export const mixin = { color: 'blue' };",
      });

    expect(() => {
      transformer.transform(`
        /** @jsx jsx */
        import { jsx } from '${pkg.name}';
        import { mixin } from './mixins';

        <div css={{ ':hover': mixin }}>hello</div>
      `);
    }).not.toThrow();
  });
});
