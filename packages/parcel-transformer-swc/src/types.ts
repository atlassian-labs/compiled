export interface ParcelTransformerSwcOpts {
  extract?: boolean;
  importSources?: string[];
  runtimeImport?: string;
  /**
   * Controls whether to use SWC or Babel for transformation.
   * - true: always use SWC
   * - false | undefined: use Babel (existing path)
   * - 'auto': try SWC, on error fall back to Babel
   */
  swc?: boolean | 'auto';
}
