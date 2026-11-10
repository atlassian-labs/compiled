import { parseSync, transformSync } from '@babel/core';
import * as t from '@babel/types';

import { transform } from '../test-utils';

function getBindingImports(code: string, name: string): t.ImportDeclaration[] {
  const ast = parseSync(code, {
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ['typescript', 'jsx'] },
  });
  if (!ast) throw new Error('Expected transformed module');
  return ast.program.body.flatMap((node) =>
    t.isImportDeclaration(node) &&
    node.specifiers.some((specifier) => specifier.local.name === name)
      ? [node]
      : []
  );
}

describe('import specifiers', () => {
  it.each([
    "import type React from 'react';",
    "import type * as React from 'react';",
    "import type { default as React } from 'react';",
    "import { type default as React } from 'react';",
    "import React from 'react';",
    "import * as React from 'react';",
    "import { default as React } from 'react';",
  ])('keeps one runtime React binding for %s', (reactImport) => {
    for (const compiledCode of [
      "import { jsx } from '@atlaskit/css'; export const Component = () => <div />;",
      "import { styled } from '@compiled/react'; export const Component = styled.div({ color: 'red' });",
    ]) {
      const actual = transform(`/** @jsx jsx */\n${reactImport}\n${compiledCode}`, {
        pretty: false,
      });
      const imports = getBindingImports(actual, 'React');
      expect(imports).toHaveLength(1);
      expect(imports[0].importKind).toBe('value');
      const specifier = imports[0].specifiers.find((node) => node.local.name === 'React');
      if (t.isImportSpecifier(specifier)) expect(specifier.importKind).not.toBe('type');
    }
  });

  it.each([
    "import type { forwardRef } from 'react';",
    "import { type forwardRef } from 'react';",
    "import { forwardRef } from 'react';",
  ])('keeps one runtime forwardRef binding for %s', (reactImport) => {
    const actual = transform(
      `${reactImport}\nimport { styled } from '@compiled/react'; const Component = styled.div({color: 'red'});`,
      { pretty: false }
    );
    const imports = getBindingImports(actual, 'forwardRef');
    expect(imports).toHaveLength(1);
    expect(imports[0].importKind).toBe('value');
    const specifier = imports[0].specifiers.find((node) => node.local.name === 'forwardRef');
    t.assertImportSpecifier(specifier);
    expect(specifier.importKind).not.toBe('type');
  });

  it.each([
    "import type { default as React, forwardRef, ReactNode } from 'react';",
    "import { type default as React, type forwardRef, type ReactNode } from 'react';",
  ])('promotes React and forwardRef while preserving sibling types in %s', (reactImport) => {
    const actual = transform(
      `${reactImport}
       import { styled } from '@compiled/react';
       const Component = styled.div({color: 'red'});`,
      { pretty: false }
    );
    const imports = getBindingImports(actual, 'React');
    expect(imports).toHaveLength(1);
    expect(imports[0].importKind).toBe('value');
    expect(
      imports[0].specifiers.map((specifier) => {
        t.assertImportSpecifier(specifier);
        return { name: specifier.local.name, kind: specifier.importKind };
      })
    ).toEqual([
      { name: 'React', kind: 'value' },
      { name: 'forwardRef', kind: 'value' },
      { name: 'ReactNode', kind: 'type' },
    ]);
  });

  it('retains the React value import through a subsequent TypeScript and classic JSX pass', () => {
    const actual = transform(
      `/** @jsx jsx */
       import { useCallback, useMemo, type ReactNode } from 'react';
       import type React from 'react';
       import { jsx } from '@atlaskit/css';
       export const Component = (): ReactNode => <div />;`,
      { pretty: false }
    );
    const lowered = transformSync(actual, {
      babelrc: false,
      configFile: false,
      filename: 'component.tsx',
      presets: [
        ['@babel/preset-react', { runtime: 'classic' }],
        ['@babel/preset-typescript', { onlyRemoveTypeImports: true }],
      ],
    });
    const code = lowered?.code ?? '';
    expect(code).toContain('React.createElement');
    expect(code).not.toContain('import type');
    expect(getBindingImports(code, 'React')).toHaveLength(1);
  });

  it('does not promote React when its runtime import is disabled', () => {
    const actual = transform(
      `import type React from 'react';
       import { css } from '@compiled/react';
       const styles = css({color: 'red'});`,
      { importReact: false, pretty: false }
    );
    expect(getBindingImports(actual, 'React')[0].importKind).toBe('type');
  });

  it.each([
    "import type React from './types';",
    "import type { ReactNode as React } from 'react';",
  ])('rejects an unrelated React type-only binding in %s', (reactImport) => {
    expect(() =>
      transform(
        `${reactImport}
       import { styled } from '@compiled/react';
       const Component = styled.div({color: 'red'});`,
        { pretty: false }
      )
    ).toThrow('Compiled requires a runtime React binding from react');
  });

  it.each([
    "import type { forwardRef } from './types';",
    "import type { ReactNode as forwardRef } from 'react';",
  ])('rejects an unrelated forwardRef type-only binding in %s', (reactImport) => {
    expect(() =>
      transform(
        `${reactImport}
       import { styled } from '@compiled/react';
       const Component = styled.div({color: 'red'});`,
        { pretty: false }
      )
    ).toThrow('Compiled requires a runtime forwardRef binding from react');
  });

  it('should remove entrypoint if no imports found', () => {
    const actual = transform(`
      import '@compiled/react';

      <div css={{}} />
    `);

    expect(actual).not.toInclude(`'@compiled/react'`);
  });

  it('should remove react primary entrypoint if no named imports found', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      <div css={{}} />
    `);

    expect(actual).not.toInclude(`'@compiled/react'`);
  });

  it('should add react import if missing', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('import * as React from "react"');
  });

  it('should do nothing if react default import is already defined', () => {
    const actual = transform(`
      import React from 'react';
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toInclude('import React from "react";');
  });

  it('should retain named imports from react when adding missing react import', () => {
    const actual = transform(`
      import { useState } from 'react';
      import { styled } from '@compiled/react';

      const ListItem = styled.div\`
        font-size: 20px;
      \`;
    `);

    expect(actual).toIncludeMultiple([
      `import * as React from "react";`,
      `import { useState } from "react";`,
    ]);
  });

  it('should transform with a rebound named import', () => {
    const actual = transform(`
      import { styled as styledFunction } from '@compiled/react';

      const ListItem = styledFunction.div({
        fontSize: '20px',
      });
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._4ya3eESPN1{font-size:20px}";
      const ListItem = forwardRef(
        ({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr) => {
          if (__cmplp.innerRef) {
            throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return (
            <CC>
              <CS>{[_]}</CS>
              <C
                {...__cmplp}
                style={__cmpls}
                ref={__cmplr}
                className={ax(["_4ya3eESPN1", __cmplp.className])}
              />
            </CC>
          );
        }
      );
      if (process.env.NODE_ENV !== "production") {
        ListItem.displayName = "ListItem";
      }
      "
    `);
  });

  it('should import runtime from the runtime entrypoint', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        fontSize: '20px',
      });
    `);

    expect(actual).toInclude('import { ax, ix, CC, CS } from "@compiled/react/runtime";');
  });
});
