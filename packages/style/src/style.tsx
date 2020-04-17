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
   * Used to set a nonce on the style element.
   * This is needed when using a strict CSP and should be a random hash generated every server load.
   * Check out https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src for more information.
   */
  nonce?: string;
}

let stylesheet: ReturnType<typeof createStyleSheet>;
const inserted: Record<string, true> = {};

const Style = (props: StyleProps) => {
  if (process.env.NODE_ENV === 'development') {
    analyzeCssInDev(props.children, props.hash);
  }

  if (typeof window === 'undefined') {
    return <style nonce={props.nonce}>{props.children}</style>;
  }

  if (!stylesheet) {
    stylesheet = createStyleSheet(props);
  }

  if (!inserted[props.hash] && props.children) {
    props.children.forEach(stylesheet.insert);
    inserted[props.hash] = true;
  }

  return null;
};

export default Style;
