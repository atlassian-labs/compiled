export interface PluginPass {
  opts: {
    /**
     * Specifies the styleSheetName used for requiring atomic styles.
     */
    styleSheetName?: string;
  };

  /**
   * Stores all found style rules during the file pass.
   */
  styleRules: string[];
}
