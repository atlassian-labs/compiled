import { outdent } from 'outdent';

import { tester } from '../../../test-utils';
import { noInvalidCssMapRule } from '../index';

tester.run('css-map', noInvalidCssMapRule, {
  valid: [
    {
      name: 'example valid css map',
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: {
            color: 'red',
            backgroundColor: 'red',
          },
          success: {
            color: 'green',
            backgroundColor: 'green',
          },
        });
      `,
    },
    {
      name: 'example valid css map with @atlaskit/css',
      code: outdent`
        import React from 'react';
        import { cssMap } from '@atlaskit/css';

        const styles = cssMap({
          danger: {
            color: 'red',
            backgroundColor: 'red',
          },
          success: {
            color: 'green',
            backgroundColor: 'green',
          },
        });
      `,
    },
    {
      name: 'valid css map with valid function calls',
      options: [{ allowedFunctionCalls: [['@atlaskit/token', 'token']] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { token } from '@atlaskit/token';

        const styles = cssMap({
          danger: {
              color: token('red', 'blue'),
              backgroundColor: 'red',
          },
          success: {
            color: 'green',
            backgroundColor: token('green', 'yellow'),
          },
        });
      `,
    },
    {
      name: 'valid css map with several valid function calls',
      options: [
        {
          allowedFunctionCalls: [
            ['example', 'firstFunction'],
            ['example', 'otherFunction'],
            ['example2', 'thirdFunction'],
          ],
        },
      ],
      code: outdent`
        import { firstFunction, otherFunction } from 'example';
        import { thirdFunction } from 'example2';
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { token } from '@atlaskit/token';

        const styles = cssMap({
          danger: {
              color: firstFunction('red', 'blue'),
              padding: \`1px \${otherFunction('green')}\`,
              margin: \`30px \${thirdFunction('purple')} 20px\`,
          },
        });
      `,
    },
    {
      name: 'valid css map with string extracted into a variable',
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';

        const bap = 'blue';

        const styles = cssMap({
          danger: {
              color: bap,
          },
        });
      `,
    },
    {
      name: 'valid css map with string concatenation',
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: {
              color: 'ali' + 'ce' + 'blue',
          },
        });
      `,
    },
    {
      name: 'valid css map with valid function call thru `import { X as Y } from Z`',
      options: [{ allowedFunctionCalls: [['@atlaskit/token', 'token']] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { token as myOtherFunction } from '@atlaskit/token';

        const styles = cssMap({
          danger: {
              color: myOtherFunction('red', 'blue'),
              backgroundColor: 'red',
          },
          success: {
            color: 'green',
            backgroundColor: myOtherFunction('green', 'yellow'),
          },
        });
      `,
    },
    {
      name: 'valid css map with imported variable',
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { bap } from '@atlaskit/token';

        const styles = cssMap({
          danger: {
            color: bap,
          },
        });
      `,
    },
    {
      name: 'valid css map with variable in template strings',
      code: outdent`
        import { firstFunction } from 'example';
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { bap } from '@atlaskit/token';

        const otherFunction = (prop) => prop;

        const styles = cssMap({
          danger: {
              padding: \`1px \${bap}\`,
          },
        });
      `,
    },
    {
      name: 'ignores from a package not in scope',
      code: outdent`
        import React from 'react';
        import { cssMap } from '@other/css';

        const foo = {
          bar: cssMap({
            danger: {
              color: 'red'
            },
          }),
        };
      `,
    },
  ],
  invalid: [
    {
      name: 'invalid test with `import as`',
      errors: [
        {
          messageId: 'noSpreadElement',
        },
      ],
      code: outdent`
        import React from 'react';
        import { css as someFunction, cssMap as someOtherFunction } from '@compiled/react';

        const base = {
          success: {
            color: 'green',
          },
        };

        const bar = someOtherFunction({
          ...base,
          danger: {
            color: 'red',
          },
        });
      `,
    },
    {
      name: 'css map not declared at the top-most scope, variant 1',
      errors: [
        {
          messageId: 'mustBeTopLevelScope',
        },
      ],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';

        const Foo = () => {
          const bar = cssMap({
            danger: {
              color: 'red',
            },
          });
        };
      `,
    },
    {
      name: 'css map not declared at the top-most scope, variant 2',
      errors: [
        {
          messageId: 'mustBeTopLevelScope',
        },
      ],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';

        const foo = {
          bar: cssMap({
            danger: {
              color: 'red'
            },
          }),
        };
      `,
    },
    {
      name: 'css map not declared at the top-most scope, variant 3',
      errors: [
        {
          messageId: 'mustBeTopLevelScope',
        },
      ],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';

        function foo() {
          const bar = cssMap({
            danger: {
              color: 'red',
            },
          });
        }
      `,
    },
    {
      name: 'css map not declared at the top-most scope, variant 4',
      errors: [
        {
          messageId: 'mustBeTopLevelScope',
        },
      ],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';

        function* foo() {
          const bar = cssMap({
            danger: {
              color: 'red',
            },
          });
        }
      `,
    },
    {
      name: 'css map not declared at the top-most scope, variant 5',
      errors: [
        {
          messageId: 'mustBeTopLevelScope',
        },
      ],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';

        function* foo() {
          yield cssMap({
            danger: {
              color: 'red',
            },
          });
        }
      `,
    },
    {
      name: 'spread element',
      errors: [
        {
          messageId: 'noSpreadElement',
        },
      ],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';

        const base = {
          success: {
            color: 'green',
          },
        };

        const bar = cssMap({
          ...base,
          danger: {
            color: 'red',
          },
        });
      `,
    },
    {
      name: 'exporting css map',
      errors: [
        {
          messageId: 'noExportedCssMap',
        },
      ],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';

        export const foo = cssMap({
          danger: {
            color: 'red',
          },
        });
      `,
    },
    {
      name: 'exporting css map (through `export default`)',
      errors: [
        {
          messageId: 'noExportedCssMap',
        },
      ],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';

        export default cssMap({
          danger: {
            color: 'red',
          },
        });
      `,
    },
    {
      name: 'getters (object methods)',
      errors: [
        {
          messageId: 'noInlineFunctions',
        },
      ],
      // This should not match the danger() used in cssMap
      options: [{ allowedFunctionCalls: [['@atlaskit/token', 'danger']] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { token } from '@atlaskit/token';

        const styles = cssMap({
          get danger() {
            return { color: '#123456' }
          },
        });
      `,
    },
    {
      name: 'arrow functions',
      errors: [
        {
          messageId: 'noInlineFunctions',
        },
      ],
      // This should not match the danger() used in cssMap
      options: [{ allowedFunctionCalls: [['@atlaskit/token', 'danger']] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { token } from '@atlaskit/token';

        const styles = cssMap({
          danger: () => { color: '#123456' },
        });
      `,
    },
    {
      name: 'function call to a forbidden imported function',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      options: [{ allowedFunctionCalls: [['@atlaskit/token', 'token']] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { token, myInvalidFunction } from '@atlaskit/token';

        const styles = cssMap({
          danger: {
            color: token('red', 'blue'),
            backgroundColor: 'red',
          },
          success: {
            color: 'green',
            backgroundColor: myInvalidFunction('green', 'yellow'),
          },
        });
      `,
    },
    {
      name: 'function call to a default export',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      options: [{ allowedFunctionCalls: [['@atlaskit/token', 'token']] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import token from '@atlaskit/token';

        const styles = cssMap({
          danger: {
            color: token('red', 'blue'),
            backgroundColor: 'red',
          },
        });
      `,
    },
    {
      // We currently do not support whitelisting default exports
      // through the allowedFunctionCalls option
      //
      // so ['@atlaskit/token', 'token'] will allow
      //     import { token } from '@atlaskit/token'
      // but not
      //     import token from '@atlaskit/token'
      name: 'function call to a default export listed in allowedFunctionCalls',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      options: [{ allowedFunctionCalls: [['@atlaskit/token', 'token']] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import token from '@atlaskit/token';

        const styles = cssMap({
          danger: {
            color: 'blue',
            backgroundColor: 'red',
          },
          success: {
            color: token('green'),
          },
        });
      `,
    },
    {
      name: 'function call to a local function',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      options: [{ allowedFunctionCalls: [['@atlaskit/token', 'token']] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';

        function token(...args) { return arguments.join(''); }

        const styles = cssMap({
          danger: {
            color: token('red', 'blue'),
            backgroundColor: 'red',
          },
        });
      `,
    },
    {
      name: 'function calls to forbidden functions with cheeky loophole (import from correct package)',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      options: [{ allowedFunctionCalls: [['@atlaskit/token', 'token']] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { invalidFunction as token } from '@atlaskit/token';

        const styles = cssMap({
          danger: {
            color: token('red', 'blue'),
            backgroundColor: 'red',
          },
          success: {
            color: 'green',
          },
        });
      `,
    },
    {
      name: 'function calls to forbidden functions with cheeky loophole (import from wrong package)',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      options: [{ allowedFunctionCalls: [['@atlaskit/token', 'token']] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { invalidFunction as token } from 'obviously-the-wrong-package';

        const styles = cssMap({
          danger: {
            color: token('red', 'blue'),
            backgroundColor: 'red',
          },
          success: {
            color: 'green',
          },
        });
      `,
    },
    {
      name: 'valid css map with invalid function calls in template strings, variant 1',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      options: [{ allowedFunctionCalls: [['example', 'firstFunction']] }],
      code: outdent`
        import { firstFunction } from 'example';
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { token } from '@atlaskit/token';

        const otherFunction = (prop) => prop;

        const styles = cssMap({
          danger: {
              color: firstFunction('red', 'blue'),
              padding: \`1px \${otherFunction('green')}\`,
          },
        });
      `,
    },
    {
      name: 'valid css map with invalid function calls in template strings, variant 2',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      options: [{ allowedFunctionCalls: [['@atlaskit/token', 'firstFunction']] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { firstFunction, token } from '@atlaskit/token';

        const otherFunction = (prop) => prop;

        const styles = cssMap({
          danger: {
            color: firstFunction('red', 'blue'),
            margin: \`30px \${otherFunction('purple')} 20px\`,
          },
        });
      `,
    },
    {
      name: 'valid css map with invalid function calls in logical expressions',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { token } from '@atlaskit/token';

        const firstFunction = (prop) => prop;

        const styles = cssMap({
          danger: {
            color: firstFunction('red') ?? 'pink',
          },
        });
      `,
    },
    {
      name: 'valid css map with invalid function calls thru variable',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { token } from '@atlaskit/token';

        const firstFunction = (prop) => prop;
        const bap = firstFunction('red');

        const styles = cssMap({
          danger: {
            color: bap,
          },
        });
      `,
    },
    {
      name: 'valid css map with invalid function calls thru variable (imported function)',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { firstFunction, token } from '@atlaskit/token';

        const bap = firstFunction('red');

        const styles = cssMap({
          danger: {
              color: bap,
          },
        });
      `,
    },
    {
      name: 'valid css map with invalid function calls in string concatenation',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { token } from '@atlaskit/token';

        const firstFunction = (prop) => prop;

        const styles = cssMap({
          danger: {
              color: 'ali' + firstFunction('ce') + 'blue',
          },
        });
      `,
    },
    {
      name: 'css map declared within an arrow function',
      errors: [
        {
          messageId: 'mustBeTopLevelScope',
        },
      ],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';

        const Foo = () => {
          const bar = cssMap({
            danger: {
              color: 'red',
            },
          });
        };
      `,
    },
  ],
});
