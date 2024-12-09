import type {
  BabelFile as OriginalBabelFile,
  BabelFileMetadata as OriginalBabelFileMetadata,
  PluginPass as OriginalPluginPass,
} from '@babel/core';

interface BabelFile extends OriginalBabelFile {
  metadata: {
    styleRules: string[];
  };
}

export interface PluginOptions {
  /**
   * Specifies the styleSheetPath used for requiring atomic styles.
   */
  styleSheetPath?: string;

  /**
   * When set will prevent additional require (one import per rule) in the bundle.
   */
  compiledRequireExclude?: boolean;

  /**
   * When set, extract styles to an external CSS file
   */
  extractStylesToDirectory?: { source: string; dest: string };

  /**
   * Whether to sort at-rules, including media queries.
   * Defaults to `true`.
   */
  sortAtRules?: boolean;

  /**
   * Whether to sort shorthand and longhand properties,
   * eg. `margin` before `margin-top` for enforced determinism.
   * Defaults to `true`.
   */
  sortShorthand?: boolean;
}

export interface PluginPass extends OriginalPluginPass {
  opts: PluginOptions;

  /**
   * Stores all found style rules during the file pass.
   */
  styleRules: string[];

  /**
   * Data of the current file being transformed.
   */
  file: BabelFile;

  /**
   * The name of the jsx function specified in the JSX pragma
   * "@ jsx nameOfJsxFunction". (Classic syntax)
   */
  classicJsxPragmaName?: string;

  /**
   * Whether the name of the jsx function (given in the jsxPragmaName
   * property) is the `jsx` function and namespace from `@compiled/react`.
   */
  jsxPragmaIsCompiled?: boolean;
}

export interface BabelFileMetadata extends OriginalBabelFileMetadata {
  styleRules?: string[];
}
