export interface PluginPass {
  opts: {
    /**
     * Specifies the styleSheetPath used for requiring atomic styles.
     */
    styleSheetPath?: string;
  };

  /**
   * Stores all found style rules during the file pass.
   */
  styleRules: string[];
}
