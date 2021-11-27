import generate from '@babel/generator';
import { declare } from '@babel/helper-plugin-utils';
import jsxSyntax from '@babel/plugin-syntax-jsx';
import * as t from '@babel/types';
import { transformCss } from '@compiled/css';
import { kebabCase } from '@compiled/utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

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

export default declare((api) => {
  api.assertVersion(7);

  return {
    name: packageJson.name,
    inherits: jsxSyntax,
    visitor: {
      CallExpression(path) {
        if (path.node.callee.type === 'Identifier' && path.node.callee.name === 'css') {
          const rule = generate(path.node.arguments[0]);
          const evaluatedExpression = eval(`(${rule.code})`);
          const styles = transformCss(objToCss(evaluatedExpression));

          path.replaceWith(
            t.arrayExpression([
              t.stringLiteral(styles.classNames.join(' ')),
              t.arrayExpression(styles.sheets.map((sheet) => t.stringLiteral(sheet))),
            ])
          );
        }
      },
    },
  };
});
