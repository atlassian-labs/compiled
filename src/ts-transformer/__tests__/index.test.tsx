import * as ts from 'typescript';
import rootTransformer from '../index';
import pkg from '../../../package.json';

describe('root transformer', () => {
  xit('should not blow up when transforming with const', () => {
    const transformer = rootTransformer({} as ts.Program, {});

    expect(() => {
      ts.transpileModule(
        `
          /** @jsx jsx */
          import { jsx } from '${pkg.name}';
          const MyComponent = () => <div css={{ fontSize: '20px' }}>hello world</div>
        `,
        {
          transformers: { before: transformer },
          compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React },
        }
      );
    }).not.toThrow();
  });

  it('should not blow up when transforming with var', () => {
    const transformer = rootTransformer({} as ts.Program, {});

    expect(() => {
      ts.transpileModule(
        `
          /** @jsx jsx */
          import { jsx } from '${pkg.name}';
          var MyComponent = () => <div css={{ fontSize: '20px' }}>hello world</div>
        `,
        {
          transformers: { before: transformer },
          compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React },
        }
      );
    }).not.toThrow();
  });
});
