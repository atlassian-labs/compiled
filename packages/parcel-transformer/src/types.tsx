export interface ParcelTransformerOpts {
  /**
   * Will import the React namespace if it is missing.
   * When using the `'automatic'` jsx runtime set this to `false`.
   */
  importReact?: boolean;

  extract?: boolean;
}
