import React from 'react';
import { useLayoutEffect } from './use-layout-effect';
import { createStyleSheet } from './sheet';

interface StyleProps {
  /**
   * CSS Rules.
   * Ensure each rule is a separate element in the array.
   */
  children: string[] | string;

  /**
   * Hash of the entire all css rules combined.
   * This is used to bypass the need of adding rules if it has already been done.
   */
  hash: string;

  /**
   *
   */
  key?: string;

  testId?: string;
}

let stylesheet: ReturnType<typeof createStyleSheet>;
const inserted: Record<string, true> = {};

const Style = ({ children, testId, hash, key = 'compiled' }: StyleProps) => {
  useLayoutEffect(() => {
    if (!stylesheet) {
      stylesheet = createStyleSheet({ key });
    }

    if (inserted[hash] || !children) {
      return;
    }

    (Array.isArray(children) ? children : [children]).forEach(rule => stylesheet.insert(rule));
    inserted[hash] = true;
  }, []);

  if (typeof window === 'undefined') {
    return (
      <style data-compiled data-testid={testId}>
        {children}
      </style>
    );
  }

  return null;
};

export default Style;
