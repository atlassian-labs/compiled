import type { BabelFileMetadata as OriginalBabelFileMetadata } from '@babel/core';

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
    opts: {
      sourceFileName: string;
    };
    metadata: {
      styleRules: string[];
    };
  };

  /**
   * Current filename
   */
  filename: string;

  /**
   * Working directory for babel
   */
  cwd: string;
}

export interface BabelFileMetadata extends OriginalBabelFileMetadata {
  styleRules?: string[];
}
