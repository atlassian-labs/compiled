const visit = require('unist-util-visit');
const YAML = require('yaml');

const exportMetaPlugin = function () {
  function transformer(ast) {
    const data = {
      headings: [],
    };

    visit(ast, 'heading', (node) => {
      const text = node.children.reduce((str, node) => str + node.value, '');
      data.headings.push({
        depth: node.depth,
        text,
      });
    });

    visit(ast, 'yaml', (node) => {
      const parsedYaml = YAML.parse(node.value);
      Object.assign(data, parsedYaml);
    });

    ast.children = [
      {
        type: 'export',
        value: `export const data = JSON.parse(\`${JSON.stringify(data)}\`);`,
        position: {},
      },
    ].concat(ast.children);
  }

  return transformer;
};

module.exports = exportMetaPlugin;
