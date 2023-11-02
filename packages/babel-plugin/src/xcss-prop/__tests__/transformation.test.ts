import { transform } from '../../test-utils';

describe('xcss prop transformation', () => {
  it('should transform static inline object', () => {
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
      "unknown file: Object given to the xcss prop must be static (4:23).
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

  it('should work with css map', () => {
    const result = transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        primary: { color: 'red' },
      });

      <Component xcss={styles.primary} />
    `);

    expect(result).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._syaz5scu{color:red}";
      const styles = {
        primary: "_syaz5scu",
      };
      <CC>
        <CS>{[_]}</CS>
        {<Component xcss={styles.primary} />}
      </CC>;
      "
    `);
  });

  it('should allow ternaries', () => {
    const result = transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        primary: { color: 'red' },
        secondary: { color: 'blue' }
      });

      <Component xcss={isPrimary ? styles.primary : styles.secondary} />
    `);

    expect(result).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = "._syaz13q2{color:blue}";
      const _ = "._syaz5scu{color:red}";
      const styles = {
        primary: "_syaz5scu",
        secondary: "_syaz13q2",
      };
      <CC>
        <CS>{[_, _2]}</CS>
        {<Component xcss={isPrimary ? styles.primary : styles.secondary} />}
      </CC>;
      "
    `);
  });

  it('should allow concatenating styles', () => {
    const result = transform(`
      import { cssMap, j } from '@compiled/react';

      const styles = cssMap({
        primary: { color: 'red' },
        secondary: { color: 'blue' }
      });

      <Component xcss={j(isPrimary && styles.primary, !isPrimary && styles.secondary)} />
    `);

    expect(result).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      import { j } from "@compiled/react";
      const _2 = "._syaz13q2{color:blue}";
      const _ = "._syaz5scu{color:red}";
      const styles = {
        primary: "_syaz5scu",
        secondary: "_syaz13q2",
      };
      <CC>
        <CS>{[_, _2]}</CS>
        {
          <Component
            xcss={j(isPrimary && styles.primary, !isPrimary && styles.secondary)}
          />
        }
      </CC>;
      "
    `);
  });

  it('should transform xcss prop when compiled is in scope', () => {
    const result = transform(
      `
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        primary: { color: 'red' },
      });

      <Component xcss={styles.primary} />
    `
    );

    expect(result).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._syaz5scu{color:red}";
      const styles = {
        primary: "_syaz5scu",
      };
      <CC>
        <CS>{[_]}</CS>
        {<Component xcss={styles.primary} />}
      </CC>;
      "
    `);
  });

  it('should not blow up transforming an empty xcss object', () => {
    const result = transform(
      `
      <Component xcss={{}} />
    `
    );

    expect(result).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      <CC>
        <CS>{[]}</CS>
        {<Component xcss={undefined} />}
      </CC>;
      "
    `);
  });

  it('should ignore primitive components using runtime xcss prop', () => {
    const result = transform(
      `
      import { Box, xcss } from '@atlaskit/primitives';

      <Box xcss={xcss({ color: 'red' })} />
    `
    );

    expect(result).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      import { Box, xcss } from "@atlaskit/primitives";
      <Box
        xcss={xcss({
          color: "red",
        })}
      />;
      "
    `);
  });

  it('should ignore primitive components mixed with compiled components', () => {
    const result = transform(
      `
      import { Box, xcss } from '@atlaskit/primitives';
      import { cssMap } from '@compiled/react';

      const styles = cssMap({ text: { color: 'red' } })

      export function Mixed() {
        return (
          <>
            <Box xcss={xcss({ color: 'red' })} />
            <Button xcss={styles.text} />
          </>
        );
      }
    `
    );

    expect(result).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      import { Box, xcss } from "@atlaskit/primitives";
      const _ = "._syaz5scu{color:red}";
      const styles = {
        text: "_syaz5scu",
      };
      export function Mixed() {
        return (
          <>
            <Box
              xcss={xcss({
                color: "red",
              })}
            />
            <CC>
              <CS>{[_]}</CS>
              {<Button xcss={styles.text} />}
            </CC>
          </>
        );
      }
      "
    `);
  });
});
