import type { Program, FileInfo, API, Options, JSXAttribute } from 'jscodeshift';

import { withPlugin, applyVisitor } from '../../codemods-helpers';
import type { CodemodPluginInstance } from '../../plugins/types';
import defaultCodemodPlugin from '../../plugins/default';

const applyInnerRefPlugin = (plugins: Array<CodemodPluginInstance>, originalNode: JSXAttribute) =>
  plugins.reduce((currentNode, plugin) => {
    const buildRefAttributeImpl = plugin.transform?.buildRefAttribute;
    if (!buildRefAttributeImpl) {
      return currentNode;
    }

    return buildRefAttributeImpl({ originalNode, currentNode });
  }, originalNode);

const transformer = (fileInfo: FileInfo, api: API, options: Options): string => {
  const { source } = fileInfo;
  const { jscodeshift: j } = api;
  const collection = j(source);
  const plugins: Array<CodemodPluginInstance> = [
    defaultCodemodPlugin,
    ...options.normalizedPlugins,
  ].map((plugin) => plugin.create(fileInfo, api, options));

  const originalProgram: Program = j(source).find(j.Program).get();

  collection
    .find(j.JSXAttribute, (node) => node.name.name === 'innerRef')
    .forEach((innerRefProp) => {
      const newRefAttr = applyInnerRefPlugin(plugins, innerRefProp.value);

      j(innerRefProp).replaceWith(newRefAttr);
    });

  applyVisitor({
    plugins,
    originalProgram,
    currentProgram: collection.find(j.Program).get(),
  });

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default withPlugin(transformer);
