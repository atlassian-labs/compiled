import { declare } from '@babel/helper-plugin-utils';
import * as t from '@babel/types';
import template from '@babel/template';

const buildStyledComponent = template(
  `
  React.forwardRef(({
    as: C = %%tag%%,
    ...props
  }, ref) => (
    <CC>
      <CS hash={%%hash%%}>{%%css%%}</CS>
      <C {...props} ref={ref} className={%%className%% + (props.className ? " " + props.className : "")} />
    </CC>
  ));
`,
  {
    plugins: ['jsx'],
  }
);

export default declare((api) => {
  api.assertVersion(7);

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      TaggedTemplateExpression(path) {
        if (
          t.isMemberExpression(path.node.tag) &&
          t.isIdentifier(path.node.tag.object) &&
          path.node.tag.object.name === 'styled'
        ) {
          const tagName = path.node.tag.property.name;
          const css = path.node.quasi.quasis.map((quasi) => quasi.value.cooked).join();

          path.replaceWith(
            buildStyledComponent({
              className: t.stringLiteral('hello'),
              hash: t.stringLiteral('hash'),
              tag: t.stringLiteral(tagName),
              css: t.arrayExpression([t.stringLiteral(css)]),
            }) as t.Node
          );
        }
      },
    },
  };
});
