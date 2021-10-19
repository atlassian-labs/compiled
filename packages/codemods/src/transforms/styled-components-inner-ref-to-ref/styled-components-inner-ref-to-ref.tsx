import type { FileInfo, API, Options, JSXAttribute } from 'jscodeshift';

import { withPlugin } from '../../codemods-helpers';
import type { CodemodPluginInstance } from '../../plugins/types';
import defaultCodemodPlugin from '../../plugins/default';

const applyInnerRefPlugin = (plugins: Array<CodemodPluginInstance>, originalNode: JSXAttribute) =>
  plugins.reduce((currentNode, plugin) => {
    const buildRefAttrsImpl = plugin.transform?.buildRefAttrs;
    if (!buildRefAttrsImpl) {
      return currentNode;
    }

    return buildRefAttrsImpl({ originalNode, currentNode });
  }, originalNode);

const transformer = (fileInfo: FileInfo, api: API, options: Options): string => {
  const { source } = fileInfo;
  const { jscodeshift: j } = api;
  const collection = j(source);
  const plugins: Array<CodemodPluginInstance> = [
    defaultCodemodPlugin,
    ...options.normalizedPlugins,
  ].map((plugin) => plugin.create(fileInfo, api, options));

  collection
    .find(j.JSXAttribute)
    .filter(({ value }) => value.name.name === 'innerRef')
    .forEach((innerRefProp) => {
      const newRefAttr = applyInnerRefPlugin(plugins, innerRefProp.value);

      j(innerRefProp).replaceWith(newRefAttr);
    });

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default withPlugin(transformer);
