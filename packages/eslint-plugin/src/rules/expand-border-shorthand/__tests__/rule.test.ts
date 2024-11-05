import { outdent } from 'outdent';

import { tester } from '../../../test-utils';
import { expandBorderShorthand } from '../index';

const packages_calls_and_imports = [
  ['css', 'css', '@atlaskit/css'],
  ['css', 'css', '@compiled/react'],
  ['styled', 'styled.div', '@compiled/react'],
  ['styled', 'styled.ul', '@compiled/react'],
  ['cssMap', 'cssMap', '@atlaskit/css'],
  ['cssMap', 'cssMap', '@compiled/react'],
];

tester.run('expand-border-shorthand', expandBorderShorthand, {
  valid: [
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `border shorthand less than 3 elements (${call}, ${imp})`,
      code: outdent`
        import {${pkg}} from '${imp}';

        const styles1 = ${call}({
          border: '1px',
        });
        const styles2 = ${call}({
          border: '2px solid',
        });
        const styles3 = ${call}({
          border: '3px red',
        });
        const styles4 = ${call}({
          border: 'red',
        });
      `,
    })),
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `not using border shorthand            (${call}, ${imp})`,
      code: outdent`
        import {${pkg}} from '${imp}';

        const styles1 = ${call}({
          borderTop: '2px solid green',
          borderRight: '3px dashed orange',
          borderBottom: '4px double purple',
          borderLeft: '5px groove teal',
        });

        const styles2 = ${call}({
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'black',
        });
      `,
    })),
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `invalid formats                       (${call}, ${imp})`,
      code: outdent`
          import {${pkg}} from '${imp}';

          const styles1 = ${call}({
            border: '1.5cm dotted ab',
          });

          const styles2 = ${call}({
            border: '1.5cm dotted abcdefghijklmnopqrstuv',
          });

          const styles3 = ${call}({
            border: '1.5cm dotted var(--color)',
          });

          const styles4 = ${call}({
            border: 'foo bar baz'
          });

          const styles5 = ${call}({
            border: '   1px     solid   blue   ',
          });
        `,
    })),
  ],
  invalid: [
    /* borderStyle borderWidth borderColor */

    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `borderStyle:keyword, borderWidth:px,      borderColor:rgb     - single property             (${call}, ${imp})`,
      code: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          border: 'none 2px rgb(1, 1, 2)',
        });
      `,
      output: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          borderWidth: '2px', borderStyle: 'none', borderColor: 'rgb(1, 1, 2)',\u0020
        });
      `,
      errors: [{ messageId: 'expandBorderShorthand' }],
    })),

    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `borderStyle:keyword, borderWidth:px,      borderColor:hex     - 2 properties, border first  (${call}, ${imp})`,
      code: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          border: 'hidden 0.5px #00b8d9',
          margin: '1px',
        });
      `,
      output: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          borderWidth: '0.5px', borderStyle: 'hidden', borderColor: '#00b8d9', margin: '1px',
        });
      `,
      errors: [{ messageId: 'expandBorderShorthand' }],
    })),

    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `borderStyle:keyword, borderWidth:rem,     borderColor:token   - 2 properties, border last   (${call}, ${imp})`,
      code: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          margin: '1px',
          border: 'dotted 1rem token("color.border.danger", "red")',
        });
      `,
      output: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          margin: '1px',
          borderWidth: '1rem', borderStyle: 'dotted', borderColor: 'token("color.border.danger", "red")',\u0020
        });
      `,
      errors: [{ messageId: 'expandBorderShorthand' }],
    })),

    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `borderStyle:keyword, borderWidth:rem,     borderColor:keyword - 3 properties, border middle (${call}, ${imp})`,
      code: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          margin: '1px, solid, blue',
          border: 'dashed 1.5rem red',
          padding: '1px',
        });
      `,
      output: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          margin: '1px, solid, blue',
          borderWidth: '1.5rem', borderStyle: 'dashed', borderColor: 'red', padding: '1px',
        });
      `,
      errors: [{ messageId: 'expandBorderShorthand' }],
    })),

    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `borderStyle:keyword, borderWidth:cm,      borderColor:keyword - borderColor duplicated      (${call}, ${imp})`,
      code: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          margin: '1px, solid, red',
          border: 'solid 1cm blue',
          borderColor: 'red',
        });
      `,
      output: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          margin: '1px, solid, red',
          borderWidth: '1cm', borderStyle: 'solid', borderColor: 'blue', borderColor: 'red',
        });
      `,
      errors: [{ messageId: 'expandBorderShorthand' }],
    })),

    /* borderWidth borderStyle borderColor */

    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `borderWidth:integer, borderStyle:keyword, borderColor:rgba    - single property             (${call}, ${imp})`,
      code: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          border: '1 double rgba(255, 0, 0, 0.5)',
        });
      `,
      output: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          borderWidth: '1', borderStyle: 'double', borderColor: 'rgba(255, 0, 0, 0.5)',\u0020
        });
        `,
      errors: [{ messageId: 'expandBorderShorthand' }],
    })),

    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `borderWidth:decimal, borderStyle:keyword, borderColor:hsl     - 2 properties, border first  (${call}, ${imp})`,
      code: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          border: '1.5 groove hsl(0, 100%, 50%)',
          margin: '1px',
        });
        `,
      output: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          borderWidth: '1.5', borderStyle: 'groove', borderColor: 'hsl(0, 100%, 50%)', margin: '1px',
        });
        `,
      errors: [{ messageId: 'expandBorderShorthand' }],
    })),

    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `borderWidth:em,      borderStyle:keyword, borderColor:token   - 2 properties, border last   (${call}, ${imp})`,
      code: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          margin: '1px',
          border: '1em ridge token("color.border.danger", "red")',
        });
        `,
      output: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          margin: '1px',
          borderWidth: '1em', borderStyle: 'ridge', borderColor: 'token("color.border.danger", "red")',\u0020
        });
        `,
      errors: [{ messageId: 'expandBorderShorthand' }],
    })),

    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `borderWidth:keyword, borderStyle:keyword, borderColor: hsla   - 3 properties, border middle (${call}, ${imp})`,
      code: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          margin: '1px solid red',
          border: 'thin inset hsla(0, 100%, 50%, 0.5)',
          padding: '1px',
        });
        `,
      output: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          margin: '1px solid red',
          borderWidth: 'thin', borderStyle: 'inset', borderColor: 'hsla(0, 100%, 50%, 0.5)', padding: '1px',
        });
        `,
      errors: [{ messageId: 'expandBorderShorthand' }],
    })),

    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `borderWidth:global,  borderStyle:global,  borderColor:keyword - borderColor duplicated      (${call}, ${imp})`,
      code: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          margin: '1px, solid, red',
          border: 'inherit inherit LightGoldenRodYellow',
          borderColor: 'red',
        });
      `,
      output: outdent`
        import {${pkg}} from '${imp}';

        const styles = ${call}({
          margin: '1px, solid, red',
          borderWidth: 'inherit', borderStyle: 'inherit', borderColor: 'LightGoldenRodYellow', borderColor: 'red',
        });
      `,
      errors: [{ messageId: 'expandBorderShorthand' }],
    })),
  ],
});
