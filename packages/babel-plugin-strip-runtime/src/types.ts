export interface PluginOptions {
  /**
   * Specifies the styleSheetPath used for requiring atomic styles.
   */
  styleSheetPath?: string;
}

export interface PluginPass {
  opts: PluginOptions;

  /**
   * Stores all found style rules during the file pass.
   */
  styleRules: string[];
}
