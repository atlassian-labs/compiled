import type { API, FileInfo, Options } from 'jscodeshift';

const transformer = (fileInfo: FileInfo, api: API, options: Options): string => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  root.find(j.ImportDeclaration).forEach((path) => {
    const source = path.node.source.value;

    if (source === '@compiled/react/runtime') {
      path.node.source = j.literal('@compiled/react/compat-runtime');
    }
  });

  return root.toSource(options.printOptions || { quote: 'single' });
};

export default transformer;
