import type { API, FileInfo } from 'jscodeshift';

import type { ProgramVisitorContext } from '../../../plugins/types';
import transformer from '../styled-components-to-compiled';

jest.disableAutomock();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineInlineTest = require('jscodeshift/dist/testUtils').defineInlineTest;

describe('styled-components-to-compiled imports transformer', () => {
  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    "import styled from 'styled-components';",
    "import { styled } from '@compiled/react';",
    'it transforms default styled-components imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    "import sc from 'styled-components';",
    "import { styled as sc } from '@compiled/react';",
    'it transforms default with different name than "styled" styled-components imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    "import { css } from 'styled-components';",
    "import { css } from '@compiled/react';",
    'it transforms named imports when they are alone'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    "import styled, { css } from 'styled-components';",
    "import { css, styled } from '@compiled/react';",
    'it transforms mixed default and named imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    "import styled, { css as customLocal1, css as customLocal2, keyframes as kf } from 'styled-components';",
    "import { css as customLocal1, css as customLocal2, keyframes as kf, styled } from '@compiled/react';",
    "it keeps extra valid named imports' aliases intact"
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    `
    import styled from 'styled-components';
    import styled2, { css } from 'styled-components';
    import { keyframes } from 'styled-components';
    `,
    `
    import { styled } from '@compiled/react';
    import { css, styled as styled2 } from '@compiled/react';
    import { keyframes } from '@compiled/react';
    `,
    'it preserves multiple imports of styled-components'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    "import styled, { keyframes as akf, css } from 'styled-components';",
    "import { css, keyframes as akf, styled } from '@compiled/react';",
    'it sorts imports alphabetically'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    `
    import styled from 'styled-components';
    import * as React from 'react';
    `,
    `
    import { styled } from '@compiled/react';
    import * as React from 'react';
    `,
    'it ignores other imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    `
    // @top-level comment

    // comment 1
    import styled from 'styled-components';
    // comment 2
    import * as React from 'react';
    `,
    `
    // @top-level comment

    // comment 1
    import { styled } from '@compiled/react';
    // comment 2
    import * as React from 'react';
    `,
    'it should not remove top level comments when transformed'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    `
    // @top-level comment

    // comment 1
    import * as React from 'react';
    // comment 2
    import styled from 'styled-components';
    `,
    `
    // @top-level comment

    // comment 1
    import * as React from 'react';
    // comment 2
    import { styled } from '@compiled/react';
    `,
    'it should not remove comments before transformed statement when not on top'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    `
    import styled, { css, keyframes, createGlobalStyle, ThemeProvider, withTheme } from 'styled-components';
    import * as React from 'react';
    `,
    `
    /* TODO(@compiled/react codemod): "createGlobalStyle" is not exported from "@compiled/react" at the moment. Please find an alternative for it. */
    /* TODO(@compiled/react codemod): "ThemeProvider" is not exported from "@compiled/react" at the moment. Please find an alternative for it. */
    /* TODO(@compiled/react codemod): "withTheme" is not exported from "@compiled/react" at the moment. Please find an alternative for it. */
    import { css, keyframes, styled } from '@compiled/react';
    import * as React from 'react';
    `,
    'it adds TODO comment for imports which are not resolved'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    `
    import { multiple, unsupported, imports } from 'styled-components';
    `,
    `
    /* TODO(@compiled/react codemod): "multiple" is not exported from "@compiled/react" at the moment. Please find an alternative for it. */
    /* TODO(@compiled/react codemod): "unsupported" is not exported from "@compiled/react" at the moment. Please find an alternative for it. */
    /* TODO(@compiled/react codemod): "imports" is not exported from "@compiled/react" at the moment. Please find an alternative for it. */
    import '@compiled/react';
    `,
    'it properly handles import statements with no supported imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    "import * as React from 'react';",
    "import * as React from 'react';",
    'it should not transform when styled-components imports are not present'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [
        {
          create: (_: FileInfo) => ({
            transform: {
              buildImport: ({ originalNode, currentNode }: any) => {
                for (const specifier of originalNode.specifiers) {
                  specifier.local.name = `${specifier.local.name}Edited`;
                }
                return currentNode;
              },
            },
          }),
        },
      ],
    },
    "import styled, { css } from 'styled-components';",
    "import { css, styled } from '@compiled/react';",
    'it should not share specifier references between the original and new imports'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [
        {
          create: (_: FileInfo, { jscodeshift: j }: API) => ({
            transform: {
              buildImport: () =>
                j.expressionStatement(
                  j.callExpression(
                    j.memberExpression(j.identifier('console'), j.identifier('log')),
                    [j.literal('Bring back Netscape')]
                  )
                ),
            },
          }),
        },
      ],
    },
    "import styled from 'styled-components';",
    "console.log('Bring back Netscape');",
    'it should use the buildImport from the plugin'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [
        {
          create: (_: FileInfo, { jscodeshift: j }: API) => ({
            transform: {
              buildImport: () =>
                j.expressionStatement(
                  j.callExpression(
                    j.memberExpression(j.identifier('console'), j.identifier('log')),
                    [j.literal('Bring back Netscape')]
                  )
                ),
            },
          }),
        },
        {
          create: (_: FileInfo, { jscodeshift: j }: API) => ({
            transform: {
              buildImport: ({ originalNode, currentNode, specifiers, compiledImportPath }: any) => {
                currentNode.comments = [
                  j.commentLine(j(originalNode).toSource(), true),
                  j.commentLine(
                    specifiers
                      .map(
                        (specifier: any) => `${specifier.imported.name} as ${specifier.local.name}`
                      )
                      .toString(),
                    true
                  ),
                  j.commentLine(compiledImportPath, true),
                ];

                return currentNode;
              },
            },
          }),
        },
      ],
    },
    `
    import styled, { css } from 'styled-components';
    `,
    `
    //import styled, { css } from 'styled-components';
    //css as css,styled as styled
    //@compiled/react
    console.log('Bring back Netscape');
    `,
    'it should pass the expected parameters to the buildImport plugins'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [
        {
          create: (_: FileInfo, { jscodeshift: j }: API) => ({
            visitor: {
              program: ({ program }: ProgramVisitorContext<void>) => {
                j(program)
                  .find(j.ImportDeclaration)
                  .insertBefore(() =>
                    j.expressionStatement(
                      j.callExpression(
                        j.memberExpression(j.identifier('console'), j.identifier('log')),
                        [j.literal('Bring back Netscape')]
                      )
                    )
                  );
              },
            },
          }),
        },
      ],
    },
    "import styled from 'styled-components';",
    "console.log('Bring back Netscape');\nimport { styled } from '@compiled/react';",
    'it should use the program visitor from the plugin'
  );
});
