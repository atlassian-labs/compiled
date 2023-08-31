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
            backgroundColor: 'red'
          },
          success: {
            color: 'green',
            backgroundColor: 'green'
          }
        });
      `,
    },
    {
      name: 'valid css map with valid function calls',
      options: [{ allowedFunctionCalls: ['token'] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { token } from '@atlaskit/token';

        const styles = cssMap({
          danger: {
              color: token('red', 'blue'),
              backgroundColor: 'red'
          },
          success: {
            color: 'green',
            backgroundColor: token('green', 'yellow'),
          }
        });
      `,
    },
    {
      name: 'valid css map with several valid function calls',
      options: [{ allowedFunctionCalls: ['firstFunction', 'otherFunction', 'thirdFunction'] }],
      code: outdent`
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
            color: "green"
          }
        };

        const bar = someOtherFunction({
          ...base,
          danger: {
            color: "red"
          }
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
              color: "red"
            }
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
              color: "red"
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
              color: "red"
            }
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
              color: "red"
            }
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
              color: "red"
            }
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
            color: "green"
          }
        };

        const bar = cssMap({
          ...base,
          danger: {
            color: "red"
          }
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
            color: "red"
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
            color: "red"
          }
        });
      `,
    },
    {
      name: 'getters (object methods)',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      // object methods are forbidden in all cases, so
      // we expect the eslint rule to ignore the fact
      // that 'danger' is in allowedFunctionCalls
      options: [{ allowedFunctionCalls: ['danger'] }],
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
      name: 'function calls to forbidden functions',
      errors: [
        {
          messageId: 'noFunctionCalls',
        },
      ],
      options: [{ allowedFunctionCalls: ['token'] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { token, myInvalidFunction } from '@atlaskit/token';

        const styles = cssMap({
          danger: {
            color: token('red', 'blue'),
            backgroundColor: 'red'
          },
          success: {
            color: 'green',
            backgroundColor: myInvalidFunction('green', 'yellow'),
          }
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
      options: [{ allowedFunctionCalls: ['token'] }],
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
      options: [{ allowedFunctionCalls: ['token'] }],
      code: outdent`
        import React from 'react';
        import { cssMap } from '@compiled/react';
        import { invalidFunction as token } from 'obviously-the-wrong-package';

        const styles = cssMap({
          danger: {
            color: token('red', 'blue'),
            backgroundColor: 'red'
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
      options: [{ allowedFunctionCalls: ['firstFunction'] }],
      code: outdent`
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
      options: [{ allowedFunctionCalls: ['firstFunction'] }],
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
              color: "red"
            },
          });
        };
      `,
    },
  ],
});
