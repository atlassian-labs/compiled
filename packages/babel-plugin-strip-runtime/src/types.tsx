export interface PluginPass {
  opts: {
    /**
     * Will callback at the end of the file pass with all found style rules.
     */
    onFoundStyleRules?: (rules: string[]) => void;
  };

  /**
   * Stores all found style rules during the file pass.
   */
  styleRules: string[];
}
