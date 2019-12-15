import * as ts from 'typescript';
import rootTransformer from '../index';
import pkg from '../../../package.json';

describe('root transformer', () => {
  it('should not blow up when transforming', () => {
    const transformer = rootTransformer({});

    expect(() => {
      ts.transpileModule(
        `/** @jsx jsx */
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
});
