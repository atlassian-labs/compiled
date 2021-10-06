# codemods

> Codemods for easy migration from [styled components](https://styled-components.com/) and [emotion](https://emotion.sh/docs/introduction).

## Available codemods

1. [styled-components-to-compiled](./src/transforms/styled-components-to-compiled)
2. [emotion-to-compiled](./src/transforms/emotion-to-compiled)

## Plugins

Codemods support a simple plugin system where supported implementations can be overridden. The `CodemodPlugin` interface
lists all the supported methods to be re-implemented. See the following example:

```ts
import type { API, FileInfo, Options } from 'jscodeshift';
import type { CodemodPlugin } from '@compiled/codemods';

const ExampleCodemodPlugin: CodemodPlugin = {
  name: 'example-codemod-plugin',
  create: (fileInfo: FileInfo, { jscodeshift: j }: API, options: Options) => ({
    visitor: {
      program({ program }) {
        j(program)
          .find(j.ImportDeclaration)
          .at(-1)
          .get()
          .insertAfter(
            j.importDeclaration(
              [j.importSpecifier(j.identifier('getFeatureFlag'))],
              j.literal('./feature-flags')
            )
          );
      },
    },
  }),
};

export default ExampleCodemodPlugin;
```
