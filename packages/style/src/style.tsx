import React from 'react';
import { useLayoutEffect } from './use-layout-effect';
import { createStyleSheet } from './sheet';

interface StyleProps {
  children: string;
  hash: string;
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

    if (inserted[hash]) {
      return;
    }

    stylesheet.insert(children);
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
