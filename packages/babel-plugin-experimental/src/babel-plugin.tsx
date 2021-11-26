import { declare } from '@babel/helper-plugin-utils';
import jsxSyntax from '@babel/plugin-syntax-jsx';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

export default declare((api) => {
  api.assertVersion(7);

  return {
    name: packageJson.name,
    inherits: jsxSyntax,
    pre() {},
    visitor: {},
  };
});
