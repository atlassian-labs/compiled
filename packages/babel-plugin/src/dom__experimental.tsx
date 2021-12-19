import { declare } from '@babel/helper-plugin-utils';
import * as t from '@babel/types';
import { transformCss } from '@compiled/css';
import { kebabCase, unique } from '@compiled/utils';

import { buildCodeFrameError } from './utils/ast';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');
const COMPILED_MODULE_EXPERIMENT = '@compiled/dom__experimental';

const objToCss = (obj: Record<string, any>): string => {
  let css = '';

  for (const key in obj) {
    const val = obj[key];
    if (typeof val === 'object') {
      const value = objToCss(val);
      css += `${key} { ${value} }`;
    } else {
      css += `${kebabCase(key)}: ${val};`;
    }
  }

  return css;
};

const toCompiledData = (styles: Record<string, any>) => {
  const compiledData: Record<string, string> = {};
  const sheets: string[] = [];

  for (const key in styles) {
    const rule = objToCss(styles[key]);
    const css = transformCss(rule);

    compiledData[key] = css.classNames.join(' ');
    sheets.push(...css.sheets);
  }

  return {
    styles: compiledData,
    sheets,
  };
};

export default declare<{ sheets: string[] }>((api) => {
  api.assertVersion(7);

  return {
    name: packageJson.name,
    pre() {
      this.sheets = [];
    },
    visitor: {
      Program: {
        exit(path) {
          if (!this.sheets.length) {
            return;
          }

          path.pushContainer(
            'body',
            t.callExpression(t.identifier('insertStyles'), [
              t.arrayExpression(unique(this.sheets.map((sheet) => t.stringLiteral(sheet)))),
            ])
          );
        },
      },
      ImportDeclaration(path) {
        if (path.node.source.value !== COMPILED_MODULE_EXPERIMENT) {
          return;
        }

        path
          .get('specifiers')[0]
          .insertBefore(
            t.importSpecifier(t.identifier('insertStyles'), t.identifier('insertStyles'))
          );
      },
      CallExpression(path) {
        if (
          !(
            t.isMemberExpression(path.node.callee) &&
            t.isIdentifier(path.node.callee.object) &&
            t.isIdentifier(path.node.callee.property) &&
            path.node.callee.object.name === 'Style' &&
            path.node.callee.property.name === 'create'
          )
        ) {
          return;
        }

        const styles = path.get('arguments')[0].evaluate();
        if (!styles.confident) {
          const path = (styles as any).deopt;
          throw buildCodeFrameError(
            'Styles must be statically defined in the module',
            path.node,
            path
          );
        }

        const data = toCompiledData(styles.value);
        this.sheets.push(...data.sheets);
        path.replaceWithSourceString(JSON.stringify(data.styles));
      },
    },
  };
});
