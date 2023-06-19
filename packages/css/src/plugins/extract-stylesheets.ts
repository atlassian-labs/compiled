import type { CustomAtRules, Visitor } from 'lightningcss';
import type { Plugin } from 'postcss';

type ExtractStylesheetsOptions = {
  callback: (sheet: string) => void;
};

/**
 * Visitor which will callback each root declaration
 */
export const extractStyleSheetsVisitor = ({ callback }: ExtractStylesheetsOptions): Visitor<CustomAtRules> => {
  const declarations = new Set();
  return {
    RuleExit(rule) {
      let hasDeclaration;
      console.log('rule', Object.getOwnPropertyNames(rule));
      // @ts-expect-error
      // for (const declaration of rule.value.declarations ?? []) {
      //   if (declarations.has(declaration)) {
      //     hasDeclaration = true;
      //   } else {
      //     declarations.add(declaration);
      //   }
      // }
      // if (!hasDeclaration) {
      //   callback(rule.toString());
      // }
      if (rule.type === 'media') {
      }
    },
  };
};

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
