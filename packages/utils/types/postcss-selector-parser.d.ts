// TODO: Remove this file once https://github.com/postcss/postcss-selector-parser/pull/224 gets merged

import selectorParser from 'postcss-selector-parser';

declare module 'postcss-selector-parser' {
  function nesting(opts?: selectorParser.NodeOptions): selectorParser.Nesting;

  interface Container {
    reduce<T>(
      callback: (
        previousValue: T,
        currentValue: selectorParser.Node,
        currentIndex: number,
        array: readonly selectorParser.Node[]
      ) => T,
      initialValue: T
    ): T;
  }
}
