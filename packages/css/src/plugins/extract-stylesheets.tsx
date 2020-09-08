import { plugin } from 'postcss';

/**
 * PostCSS plugin which will callback when traversing through each root declaration.
 */
export const extractStyleSheets = plugin<{ callback: (sheet: string) => void }>(
  'extract-style-sheets',
  (opts) => {
    return (root) => {
      root.each((node) => {
        opts?.callback(node.toString());
      });
    };
  }
);
