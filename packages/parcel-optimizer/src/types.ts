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

  /**
   * Whether to sort shorthand and longhand properties,
   * eg. `margin` before `margin-top` for enforced determinism.
   * Defaults to `true`.
   */
  sortShorthand?: boolean;
}
