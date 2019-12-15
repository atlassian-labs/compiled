import * as ts from 'typescript';
import rootTransformer from '../index';
import pkg from '../../../package.json';

describe('root transformer', () => {
  xit('should not blow up when finding a const variable', () => {
    const transformer = rootTransformer({});

    const { outputText } = ts.transpileModule(
      `/** @jsx jsx */
        import { jsx } from '${pkg.name}';

        const MyComponent = () => <div css={{ fontSize: '20px' }}>hello world</div>
    `,
      {
        transformers: { before: transformer },
        compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React },
      }
    );

    expect(outputText).toBeDefined();
  });
});
