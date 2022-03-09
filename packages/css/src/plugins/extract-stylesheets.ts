import type { Plugin } from 'postcss';

/**
 * PostCSS plugin which will callback when traversing through each root declaration.
 */
export const extractStyleSheets = (opts?: { callback: (sheet: string) => void }): Plugin => {
  return {
    postcssPlugin: 'extract-style-sheets',
    OnceExit(root) {
      root.each((node) => {
        opts?.callback(node.toString());
      });
    },
  };
};

export const postcss = true;
