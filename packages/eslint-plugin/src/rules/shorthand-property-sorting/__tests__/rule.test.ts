import { outdent } from 'outdent';

import { typeScriptTester as tester } from '../../../test-utils';
import { shorthandFirst } from '../index';

const includedImports = ['@compiled/react', '@atlaskit/css'] as const;

tester.run('shorthand-property-sorting', shorthandFirst, {
  valid: includedImports.flatMap((imp) => [
    //
    // correct property ordering
    //

    {
      name: `correct property ordering (css, ${imp})`,
      code: outdent`
        import { css } from '${imp}';
        const styles = css({
          // comments indicate the shorthand property's bucket number
          margin: '...', // 1
          border: '...', // 1
          borderColor: '...', // 2
          borderBlock: '...', // 3
          borderBottom: '...', // 4
          borderBlockEnd: '...', // 5
          borderBlockStart: '...', // 5
          paddingTop: '...',
          color: '...',
        });
        export const EmphasisText1 = ({ children }) => <span css={styles}>{children}</span>;
      `,
    },
    {
      name: `correct property ordering (cssMap, ${imp})`,
      code: outdent`
        import { cssMap } from '${imp}';
        const styles = cssMap({
          warning: {
            margin: '...', // 1
            border: '...', // 1
            borderColor: '...', // 2
            borderBlock: '...', // 3
            borderBottom: '...', // 4
            borderBlockEnd: '...', // 5
            borderBlockStart: '...', // 5
            paddingTop: '...',
            color: '...',
          },
        });
        export const EmphasisText1 = ({ children }) => <span css={styles['warning']}>{children}</span>;
      `,
    },
    {
      name: `correct property ordering (styled, ${imp})`,
      code: outdent`
        import { styled } from '${imp}';
        export const Component = styled.div({
          margin: '...', // 1
          border: '...', // 1
          borderColor: '...', // 2
          borderBlock: '...', // 3
          borderBottom: '...', // 4
          borderBlockEnd: '...', // 5
          borderBlockStart: '...', // 5
          paddingTop: '...',
          color: '...',
        });
      `,
    },

    //
    // incorrect property ordering from unregulated package
    //

    {
      name: 'incorrect property ordering (css, from unregulated package)',
      code: outdent`
        import { css } from 'wrongpackage';
        const styles = css({
          borderTop: '1px solid #00b8d9',
          border: '#00b8d9',
        });
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
    },
    {
      name: 'incorrect property ordering (styled, from unregulated package)',
      code: outdent`
        import { css } from 'wrongpackage';
        export const Component = styled.div({
          borderTop: '1px solid #00b8d9',
          border: '#00b8d9',
        });
      `,
    },
    {
      name: 'incorrect property ordering (cssMap, from unregulated package)',
      code: outdent`
        import { cssMap } from 'wrongpackage';
        const styles = cssMap({
          warning: {
            borderTop: '1px solid #00b8d9',
            border: '...',
          },
          normal: {
            borderTop: '1px solid blue',
            border: '...',
          }
        });
        export const EmphasisText = ({ children, appearance }) => <span css={styles[appearance]}>{children}</span>;
      `,
    },

    //
    // properties with different depth levels that are not shorthands of each other
    //

    {
      name: `properties with different depth levels that are not shorthands of each other (css, ${imp})`,
      code: outdent`
        import { css } from '${imp}';
        const styles = css({
          borderColor: '#00b8d9', // 2
          font: '#00b8d9', // 1
        });
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
    },
    {
      name: `properties with different depth levels that are not shorthands of each other (cssMap, ${imp})`,
      code: outdent`
        import { cssMap } from '${imp}';
        const styles = cssMap({
          warning: {
            borderColor: '#00b8d9', // 2
            font: '#00b8d9', // 1
          },
          normal: {
            borderColor: '...', // 2
            font: '...', // 1
          }
        });
        export const EmphasisText = ({ children, appearance }) => <span css={styles[appearance]}>{children}</span>;
      `,
    },
    {
      // note that styled does not exist for @atlaskit/css
      name: 'properties with different depth levels that are not shorthands of each other (styled, @compiled/react)',
      code: outdent`
        import { styled } from '@compiled/react';
        const Component = styled.div({
          borderColor: '#00b8d9', // 2
          font: '#00b8d9', // 1
        });
      `,
    },

    //
    // depth in correct order for shorthand properties in the same bucket
    //

    {
      name: `depth in correct order for shorthand properties in the same bucket (css, ${imp})`,
      code: outdent`
        import { css } from '${imp}';
        const styles = css({
          borderColor: '#00b8d9', // 2
          borderTop: '1px solid #00b8d9', // 4
        });
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
    },
    {
      // styled doesn't exist for @atlaskit/css
      name: 'depth in correct order for shorthand properties in the same bucket (styled, @compiled/react)',
      code: outdent`
        import { styled } from '@compiled/react';
        const Component = styled.div({
          borderColor: '#00b8d9', // 2
          borderTop: '1px solid #00b8d9', // 4
        });
      `,
    },

    //
    // shorthands in different selectors
    //

    {
      name: `shorthands in different selectors (styled, ${imp})`,
      code: outdent`
        import { styled } from '${imp}';

        const Component = styled.div({
          '&:hover': {
            borderTop: '...', // pseudo-selectors are sorted after non-pseudo-selectors
          },
          'div ul': {
            borderTop: '...',
          },
          border: '...',
        });
      `,
    },

    //
    // template strings are not supported
    //

    {
      name: 'template strings are not supported',
      code: outdent`
        import { styled } from '@compiled/react';

        const Component = styled.div\`
          border-top: 3px;
          border: solid 4px white,
        \`;
      `,
    },

    //
    // spread element in styled is not supported
    //

    {
      name: 'spread element in styled is not supported',
      code: `
        import { styled } from '@compiled/react';

        const styles = {
          paddingTop: '5px',
        };

        const Component = styled.div({
          ...styles,
          padding: '10px',
        });
      `,
    },

    //
    // incorrect property ordering -> nested ObjectExpression is not supported
    //

    {
      name: `incorrect property ordering -> nested ObjectExpression is not supported (css, ${imp})`,
      // this is a false negative, but to be honest, it should be using cssMap instead
      code: outdent`
        import { css } from '${imp}';
        const containerAppearance = {
          default: css({
            borderBlockEnd: '1px solid #00b8d9',
            borderBlock: '#00b8d9',
            border: '#00b8d9',
          }),
          success: css({
            border: '#00b8d9',
            borderBlock: '#00b8d9',
            borderBlockEnd: '1px solid #00b8d9',
          }),
          inverse: css({
            border: '#00b8d9',
            borderBlockEnd: '1px solid #00b8d9',
            borderBlock: '#00b8d9',
          }),
        };

        export const EmphasisText = ({ children, status }) => <span css={containerAppearance[status]}>{children}</span>;
      `,
    },

    //
    // has a valid sorting for borderInlineStart and borderInlineEnd
    //

    {
      name: 'has a valid sorting for borderInlineStart and borderInlineEnd',
      code: `
        import { styled } from '@compiled/react';

        const Bap = styled.div({
          borderTop: 'none',
          borderInlineStart: 'none',
          borderInlineEnd: 'none',
        });
      `,
    },

    //
    // styles is not defined
    //

    {
      // People really should not be doing this, so no point in handling this case.
      //
      // This test case is just to make sure the rule does not crash when it encounters
      // this kind of edge case.
      name: 'styles is not defined',
      code: `
        import { css, jsx } from '@compiled/react';

        let styles;
        const someCondition = true;
        if (someCondition) {
          styles = css({ top: 0 });
        } else {
          styles = css({ top: '2px' });
        }
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
    },
  ]),

  invalid: includedImports.flatMap((imp) => [
    //
    // incorrect property ordering with two shorthand properties
    //

    {
      name: `incorrect property ordering with two shorthand properties (css, ${imp})`,
      code: outdent`
        import { css } from '${imp}';
        const styles = css({
          borderTop: '1px solid #00b8d9',
          border: '#00b8d9',
        });
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },
    {
      name: `incorrect property ordering with two shorthand properties (cssMap, ${imp})`,
      code: outdent`
        import { cssMap } from '${imp}';
        const styles = cssMap({
          normal: {
            padding: '5px',
          },
          warning: {
            // incorrect ordering here
            borderTop: '1px solid #00b8d9',
            border: '#00b8d9',
          },
        });
        export const EmphasisText = ({ children, status }) => <span css={styles[status]}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },
    {
      name: `incorrect property ordering with two shorthand properties (styled, @compiled/react)`,
      code: outdent`
        import { styled } from '@compiled/react';
        const Component = styled.div({
          borderTop: '1px solid #00b8d9',
          border: '#00b8d9',
        });
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // property not in bucket
    //

    {
      name: `incorrect property ordering with one shorthand and one longhand (css, ${imp})`,
      code: outdent`
        import { css } from '${imp}';
        const styles = css({
          transitionDuration: '...', // infinity
          transition: '...', // 1
        });
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // incorrect property ordering with multiple css calls
    //

    {
      name: 'incorrect property ordering with multiple css calls',
      code: outdent`
        import { css } from '@compiled/react';

        const styles = css({
          paddingTop: '1px',
        });
        const styles2 = css({
          padding: '2px 3px 4px',
        });
        const hello = true;
        const world = true;
        export const EmphasisText = ({ children }) => <span css={[hello && styles, !world && styles2]}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // incorrect property ordering with css and cssMap calls
    //

    {
      name: 'incorrect property ordering with css and cssMap calls',
      code: outdent`
        import { css, cssMap } from '@compiled/react';

        const styles = css({
          paddingTop: '1px',
        });
        const paddingMap = cssMap({
          normal: { padding: '2px' },
          warning: {},
        })
        const hello = true;
        const world = true;
        export const EmphasisText = ({ children, status }) => <span css={[hello && styles, paddingMap[status]]}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // incorrect property ordering with padding
    //

    {
      name: `incorrect property ordering with padding (css, ${imp})`,
      code: outdent`
        import { css } from '@compiled/react';
        const styles = css({
          paddingTop: '1px',
          padding: '2px 3px 4px',
        });
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // shorthands in different selectors are not supported
    //

    {
      name: 'shorthands in different selectors are not supported (styled, @compiled/react)',
      code: outdent`
        import { styled } from '@compiled/react';
        const BaseComponent = styled.div({
          borderTopColor: 'white',
        });
        const Component = styled(BaseComponent)({
          border: '...',
        });
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // css inside styled
    //

    {
      name: 'css inside styled',
      code: outdent`
        import { css, styled } from '@compiled/react';
        const Component = styled.div(
          {
            paddingTop: '...',
          },
          ({ disableClick }) => disableClick && css({
            padding: '...',
          })
        );
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    {
      name: 'css inside styled, through another variable',
      code: outdent`
        import { css, styled } from '@compiled/react';
        const paddingStyles = css({ paddingTop: '...' });
        const Component = styled.div(
          paddingStyles,
          { padding: '...' },
        );
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // incorrect property ordering -> 3 properties
    //

    {
      name: `incorrect property ordering -> 3 properties (css, ${imp})`,
      code: outdent`
      import { css } from '${imp}';
      const styles = css({
        borderColor: '#00b8d9', // 2
        font: '#00b8d9', // 1
        border: '#00b8d9', // 1
      });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },
    {
      name: `incorrect property ordering -> 3 properties (cssMap, ${imp})`,
      code: outdent`
        import { cssMap } from '${imp}';
        const styles = cssMap({
          normal: {
            padding: '5px',
          },
          warning: {
            // incorrect ordering here
            borderColor: '#00b8d9', // 2
            font: '#00b8d9', // 1
            border: '#00b8d9', // 1
          },
        });

        export const EmphasisText = ({ children, status }) => <span css={styles[status]}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },
    {
      name: `incorrect property ordering -> 3 properties (styled, @compiled/react)`,
      code: outdent`
        import { styled } from '@compiled/react';
        export const Component = styled.div({
          borderColor: '#00b8d9', // 2
          font: '#00b8d9', // 1
          border: '#00b8d9', // 1
        });
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // incorrect property ordering -> inline
    //

    {
      name: `incorrect property ordering -> inline (css, ${imp})`,
      code: outdent`
        import { css } from '${imp}';
        export const EmphasisText = ({ children }) => <span css={
          css({ borderTop: '1px solid #00b8d9', border: '#00b8d9' })
        }>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // incorrect property ordering -> two cssMap function calls
    //

    {
      name: `incorrect property ordering -> two cssMap function calls (${imp})`,
      code: outdent`
        import { cssMap } from '${imp}';
        const paddingMap = cssMap({
          normal: { padding: '2px' },
          warning: { paddingTop: '2px' },
        })
        const otherMap = cssMap({
          normal: { padding: '2px' },
          warning: { paddingTop: '2px' },
        })
        export const EmphasisText = ({ children }) => <span css={[paddingMap.warning, otherMap.normal]}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // incorrect property ordering -> two references to one cssMap
    //

    {
      name: `incorrect property ordering -> two references to one cssMap (${imp})`,
      code: outdent`
        import { cssMap } from '${imp}';
        const paddingMap = cssMap({
          normal: { padding: '2px' },
          warning: { paddingTop: '2px' },
        })
        export const EmphasisText = ({ children }) => <span css={[paddingMap.warning, paddingMap.normal]}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // incorrect property ordering -> css and cssMap
    //

    {
      name: `incorrect property ordering -> css and cssMap (${imp})`,
      code: outdent`
        import { css, cssMap } from '${imp}';
        const styles = cssMap({
          root: {
            paddingTop: '5px',
          },
          warning: {
            // ...
          },
        });

        const extraPadding = css({
          padding: '5px',
        });

        const Component = ({ children }) => {
          return <div css={[styles.root, extraPadding]}>{children}</div>;
        };
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // incorrect property ordering -> borderTop and borderColor
    //

    {
      name: `incorrect property ordering -> borderTop and borderColor (css, ${imp})`,
      code: outdent`
        import { css } from '${imp}';
        const styles = css({
          borderTop: '1px solid #00b8d9',
          borderColor: '#00b8d9',
        });
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // incorrect property ordering -> 6 reordering errors
    //

    {
      name: `incorrect property ordering -> 6 reordering errors (css, ${imp})`,
      code: outdent`
        import { css } from '${imp}';
        const styles = css({
          borderTop: '1px solid #00b8d9',
          border: '#00b8d9',
          borderColor: '#00b8d9',
          borderRight: '#00b8d9',
          gridTemplate: '1fr 1fr',
          gridRow: '1',
          borderBlockStart: '10px',
        });
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // includes pseudo-selectors -> pseudo is out of order
    //

    {
      name: `includes pseudo-selectors -> pseudo is out of order (css, ${imp})`,
      code: outdent`
        import { css } from '${imp}';
        const styles = css({
          '&:hover': {
              borderTop: '1px solid #00b8d9', // 4
              borderColor: 'red', // 2
              border: '1px solid #00b8d9', // 1
          },
          border: '1px solid #00b8d9', // 1
          borderColor: 'red', // 2
          borderTop: '1px solid #00b8d9', // 4
        });

        const Component = <div css={styles} />;
      `,
      errors: [
        { messageId: 'shorthand-first' },
        { messageId: 'shorthand-first' },
        { messageId: 'shorthand-first' },
        { messageId: 'shorthand-first' },
      ],
    },

    //
    // includes pseudo-selectors -> non-pseudo selectors is out of order
    //

    {
      name: `includes pseudo-selectors -> non-pseudo selectors are out of order (css, ${imp})`,
      code: outdent`
        import { css } from '${imp}';
        const styles = css({
          '&:hover': {
            border: '1px solid #00b8d9', // 1
            borderColor: 'red', // 2
            borderTop: '1px solid #00b8d9', // 4
          },
          borderTop: '1px solid #00b8d9', // 4
          borderColor: 'red', // 2
          border: '1px solid #00b8d9', // 1
        });

        const Component = <div css={styles} />;
        `,
      errors: [
        // Four violations, because
        //
        // * borderTop and border out of order
        // * borderColor and borderTop out of order
        //
        // and two violations for EACH pair that is out of order.
        { messageId: 'shorthand-first' },
        { messageId: 'shorthand-first' },
        { messageId: 'shorthand-first' },
        { messageId: 'shorthand-first' },
      ],
    },

    //
    // includes pseudo-selectors -> pseudo and non-pseudo selectors is out of order
    //

    {
      name: `includes pseudo-selectors -> pseudo and non-pseudo are out of order (css, ${imp})`,
      code: outdent`
        import { css } from '${imp}';
        const styles = css({
          '&:hover': {
              borderTop: '1px solid #00b8d9', // 4
              borderColor: 'red', // 2
              border: '1px solid #00b8d9', // 1
          },
          borderTop: '1px solid #00b8d9', // 4
          borderColor: 'red', // 2
          border: '1px solid #00b8d9', // 1
        });

        const Component = <div css={styles} />;
      `,
      errors: [
        { messageId: 'shorthand-first' },
        { messageId: 'shorthand-first' },
        { messageId: 'shorthand-first' },
        { messageId: 'shorthand-first' },
        { messageId: 'shorthand-first' },
        { messageId: 'shorthand-first' },
        { messageId: 'shorthand-first' },
        { messageId: 'shorthand-first' },
      ],
    },

    //
    // works with cx
    //

    {
      // https://atlassian.design/components/css/overview#cx
      name: 'works with cx (css and JSX element)',
      code: outdent`
        import { cssMap, cx } from '@atlaskit/css';
        const styles = cssMap({
          success: {
            padding: '...',
          },
          root: { paddingTop: '...' },
        });

        <div css={cx(styles.root, styles.success)} />
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },
    {
      // https://atlassian.design/components/css/overview#cx
      name: 'works with cx (xcss and Primitives)',
      code: outdent`
        import { cssMap, cx } from '@atlaskit/css';
        import { Box } from '@atlaskit/primitives';

        const styles = cssMap({
          success: {
            padding: '...',
          },
          root: { paddingTop: '...' },
        });

        <Box xcss={cx(styles.root, styles.success)} />
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // false positives for cssMap
    //

    {
      name: `false positive: shorthands in different selectors for cssMap if key not static (${imp})`,
      code: outdent`
        import { cssMap } from '${imp}';
        const styles = cssMap({
          warning: {
            borderTop: '...',
          },
          normal: {
            border: '...',
          }
        });
        export const EmphasisText = ({ children, appearance }) => <span css={styles[appearance]}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },
    {
      // this is a false positive, but making an exception for this would involve
      // some extra logic... maybe we can revisit this if it becomes a common situation.
      name: `false positive, if depth in correct order for shorthand properties in the same bucket for cssMap AND if key not static (${imp})`,
      code: outdent`
        import { cssMap } from '${imp}';
        const styles = cssMap({
          warning: {
            borderColor: '...', // 2
            borderTop: '...', // 1
          },
          normal: {
            borderColor: '...', // 2
            borderTop: '...', // 1
          }
        });
        export const EmphasisText = ({ children, appearance }) => <span css={styles[appearance]}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },

    //
    // 'all' property should come before any other property
    //

    {
      name: `'all' property should come before any other property (css, ${imp})`,
      code: outdent`
        import { css } from '${imp}';
        const styles = css({
          paddingRight: '...',
          all: '...',
        });
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    },
  ]),
});
