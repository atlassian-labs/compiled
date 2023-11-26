import { transform } from '../test-utils';

describe('import specifiers', () => {
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
      const _ = "._1wybgktf{font-size:20px}";
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
                className={ax(["_1wybgktf", __cmplp.className])}
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
