export interface PluginPass {
  opts: {
    onFoundStyleSheet?: (style: string) => void;
  };
}
