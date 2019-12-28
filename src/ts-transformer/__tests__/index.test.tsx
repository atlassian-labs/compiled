import { Transformer } from 'ts-transformer-testing-library';
import { rawTransformers } from '../index';
import pkg from '../../../package.json';

const transformer = new Transformer()
  .addTransformers(rawTransformers)
  .addMock({ name: pkg.name, content: `export const jsx: any = () => null` })
  .setFilePath('/index.tsx');

describe('root transformer', () => {
  it('should not blow up when transforming with const', () => {
    expect(() => {
      transformer.transform(
        `
          /** @jsx jsx */
          import { jsx } from '${pkg.name}';
          const MyComponent = () => <div css={{ fontSize: '20px' }}>hello world</div>
        `
      );
    }).not.toThrow();
  });

  it('should not blow up when transforming with var', () => {
    expect(() => {
      transformer.transform(
        `
          /** @jsx jsx */
          import { jsx } from '${pkg.name}';
          var MyComponent = () => <div css={{ fontSize: '20px' }}>hello world</div>
        `
      );
    }).not.toThrow();
  });
});
