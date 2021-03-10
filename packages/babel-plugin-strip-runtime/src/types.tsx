export interface PluginPass {
  opts: {
    onFoundStyleRules?: (rules: string[]) => void;
  };

  styleRules: string[];
}
