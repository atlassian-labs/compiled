import React from 'react';
import { createStyleSheet } from './sheet';
import { analyzeCssInDev } from './dev-warnings';

interface StyleProps {
  /**
   * CSS Rules.
   * Ensure each rule is a separate element in the array.
   */
  children: string[];

  /**
   * Hash of the entire all css rules combined.
   * This is used to bypass the need of adding rules if it has already been done.
   */
  hash: string;

  /**
   * A testId prop is provided for specified elements,
   * which is a unique string that appears as a data attribute data-testid in the rendered code,
   * serving as a hook for automated tests.
   */
  testId?: string;
}

let stylesheet: ReturnType<typeof createStyleSheet>;
const inserted: Record<string, true> = {};

const Style = (props: StyleProps) => {
  if (process.env.NODE_ENV === 'development') {
    analyzeCssInDev(props.children, props.hash);
  }

  if (typeof window === 'undefined') {
    return <style data-testid={props.testId}>{props.children}</style>;
  }

  if (!stylesheet) {
    stylesheet = createStyleSheet({});
  }

  if (!inserted[props.hash] && props.children) {
    props.children.forEach(stylesheet.insert);
    inserted[props.hash] = true;
  }

  return null;
};

export default Style;
