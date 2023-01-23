import { transform } from '../test-utils';

describe('rule hoisting', () => {
  it('should hoist to the top of the module', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = () => (
        <>
          <div css={{ fontSize: 12 }}>hello world</div>
          <div css={{ fontSize: 24 }}>hello world</div>
        </>
      );
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = "._1wyb1tcg{font-size:24px}";
      const _ = "._1wyb1fwx{font-size:12px}";
      const Component = () => (
        <>
          <CC>
            <CS>{[_]}</CS>
            {<div className={ax(["_1wyb1fwx"])}>hello world</div>}
          </CC>
          <CC>
            <CS>{[_2]}</CS>
            {<div className={ax(["_1wyb1tcg"])}>hello world</div>}
          </CC>
        </>
      );
      "
    `);
  });

  it('should reuse rules already hoisted', () => {
    const actual = transform(`
      import '@compiled/react';

      const Component = () => (
        <>
          <div css={{ fontSize: 12 }}>hello world</div>
          <div css={{ fontSize: 12 }}>hello world</div>
        </>
      );
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._1wyb1fwx{font-size:12px}";
      const Component = () => (
        <>
          <CC>
            <CS>{[_]}</CS>
            {<div className={ax(["_1wyb1fwx"])}>hello world</div>}
          </CC>
          <CC>
            <CS>{[_]}</CS>
            {<div className={ax(["_1wyb1fwx"])}>hello world</div>}
          </CC>
        </>
      );
      "
    `);
  });
});
