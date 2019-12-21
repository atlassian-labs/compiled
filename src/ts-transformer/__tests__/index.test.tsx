import * as ts from 'typescript';
import { rawTransformers } from '../index';
import pkg from '../../../package.json';
import { createFullTransform } from '../../__tests__/utils/transform';

const fullTransform = createFullTransform(rawTransformers);

describe('root transformer', () => {
  it('should not blow up when transforming with const', () => {
    expect(() => {
      fullTransform(
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
      fullTransform(
        `
          /** @jsx jsx */
          import { jsx } from '${pkg.name}';
          var MyComponent = () => <div css={{ fontSize: '20px' }}>hello world</div>
        `
      );
    }).not.toThrow();
  });
});
