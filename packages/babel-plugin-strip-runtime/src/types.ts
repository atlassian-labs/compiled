export interface PluginOptions {
  /**
   * Specifies the styleSheetPath used for requiring atomic styles.
   */
  styleSheetPath?: string;

  /**
   * When set will prevent additional require (one import per rule) in the bundle.
   */
  compiledRequireExclude?: boolean;
}

export interface PluginPass {
  opts: PluginOptions;

  /**
   * Stores all found style rules during the file pass.
   */
  styleRules: string[];


  /**
   * Data of the current file being transformed.
   */
  file: {
    metadata: {
      styleRules: string[];
    };
  };
}
