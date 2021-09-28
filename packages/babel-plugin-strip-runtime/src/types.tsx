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
  /**
   * Stores all removed node (local) names during the file pass.
   */
  removed: Set<string>;
}
