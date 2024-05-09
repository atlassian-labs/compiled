export interface ParcelOptimizerOpts {
  /**
   * Indicates whether CSS content is inlined in HTML or served as a external .css file.
   * Defaults to `false`.
   */
  inlineCss: boolean;

  /**
   * Whether to sort at-rules, including media queries.
   * Defaults to `true`.
   */
  sortAtRules: boolean;
}
