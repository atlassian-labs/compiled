import type { Plugin } from 'postcss';

/**
 * PostCSS plugin which will callback when traversing through each root declaration.
 */
export const extractStyleSheets = (opts?: { callback: (sheet: string) => void }): Plugin => {
  return {
    OnceExit(root) {
      root.each((node) => {
        opts?.callback(node.toString());
      });
    },
    postcssPlugin: 'extract-style-sheets',
  };
};

export const postcss = true;
