import { transform } from '../../test-utils';

describe('xcss prop transformation', () => {
  it('should transform style map usage', () => {
    const result = transform(`
      <Component xcss={{ color: 'red' }} />
    `);

    expect(result).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._syaz5scu{color:red}";
      <CC>
        <CS>{[_]}</CS>
        {<Component xcss={"_syaz5scu"} />}
      </CC>;
      "
    `);
  });

  it('should throw when not static', () => {
    expect(() => {
      transform(
        `
      import { bar } from './foo';

      <Component xcss={{ color: bar }} />
    `,
        { highlightCode: false }
      );
    }).toThrowErrorMatchingInlineSnapshot(`
      "unknown file: Object given to xcss prop must be static (4:23).
        2 |       import { bar } from './foo';
        3 |
      > 4 |       <Component xcss={{ color: bar }} />
          |                        ^^^^^^^^^^^^^^
        5 |     "
    `);
  });

  it('should transform named xcss prop usage', () => {
    const result = transform(`
      <Component innerXcss={{ color: 'red' }} />
    `);

    expect(result).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._syaz5scu{color:red}";
      <CC>
        <CS>{[_]}</CS>
        {<Component innerXcss={"_syaz5scu"} />}
      </CC>;
      "
    `);
  });

  xit('should ignore intermediate functions', () => {});

  xit('should transform local statically analyzable object', () => {});
});
