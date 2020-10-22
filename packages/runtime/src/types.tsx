export interface StyleSheetOpts {
  /**
   * Used to set a nonce on the style element.
   * This is needed when using a strict CSP and should be a random hash generated every server load.
   * Check out https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src for more information.
   */
  nonce?: string;
}

/**
 * Buckets under which we will group our stylesheets
 */
export type Bucket = '' | 'l' | 'v' | 'fw' | 'f' | 'fv' | 'h' | 'a' | 'm';
