import React from 'react';
import { useLayoutEffect } from './use-layout-effect';
import { createStyleSheet } from './sheet';

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
  useLayoutEffect(() => {
    if (!stylesheet) {
      stylesheet = createStyleSheet({});
    }

    if (inserted[props.hash] || !props.children) {
      return;
    }

    props.children.forEach(stylesheet.insert);
    inserted[props.hash] = true;
  }, []);

  return typeof window === 'undefined' ? (
    <style data-testid={props.testId}>{props.children}</style>
  ) : null;
};

export default Style;
