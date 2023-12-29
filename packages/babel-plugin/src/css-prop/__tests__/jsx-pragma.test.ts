import { transform } from '../../test-utils';

describe('local jsx namespace', () => {
  it('should transform css prop using jsx import source', () => {
    const actual = transform(`
      /** @jsxImportSource @compiled/react */

      <div css={{ color: 'red' }}>hello</div>;
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._syaz5scu{color:red}";
      <CC>
        <CS>{[_]}</CS>
        {<div className={ax(["_syaz5scu"])}>hello</div>}
      </CC>;
      "
    `);
  });

  it('should transform css prop using jsx pragma', () => {
    const actual = transform(`
      /** @jsxRuntime classic */
      /** @jsx jsx */
      import { jsx } from '@compiled/react';

      <div css={{ color: 'red' }}>hello</div>;
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._syaz5scu{color:red}";
      <CC>
        <CS>{[_]}</CS>
        {<div className={ax(["_syaz5scu"])}>hello</div>}
      </CC>;
      "
    `);
  });
});
