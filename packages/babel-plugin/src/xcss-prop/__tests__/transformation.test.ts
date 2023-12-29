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
      "import { Box, xcss } from "@atlaskit/primitives";
      <Box
        xcss={xcss({
          color: "red",
        })}
      />;
      "
    `);
  });

  it('should only add styles to xcss call sites that use them', () => {
    const result = transform(
      `
      import { cssMap } from '@compiled/react';
      import Button from '@atlaskit/button';

      const stylesOne = cssMap({ text: { color: 'red' } })
      const stylesTwo = cssMap({ text: { color: 'blue' } })

      export function Mixed() {
        return (
          <>
            <Button xcss={stylesOne.text} />
            <Button xcss={stylesTwo.text} />
          </>
        );
      }
    `
    );

    expect(result).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      import Button from "@atlaskit/button";
      const _2 = "._syaz13q2{color:blue}";
      const _ = "._syaz5scu{color:red}";
      const stylesOne = {
        text: "_syaz5scu",
      };
      const stylesTwo = {
        text: "_syaz13q2",
      };
      export function Mixed() {
        return (
          <>
            <CC>
              <CS>{[_]}</CS>
              {<Button xcss={stylesOne.text} />}
            </CC>
            <CC>
              <CS>{[_2]}</CS>
              {<Button xcss={stylesTwo.text} />}
            </CC>
          </>
        );
      }
      "
    `);
  });

  it('should ignore primitive components mixed with compiled components', () => {
    const result = transform(
      `
      import { Box, xcss } from '@atlaskit/primitives';
      import Button from '@atlaskit/button';
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

    // Here, xcss runs at runtime
    expect(result).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      import { Box, xcss } from "@atlaskit/primitives";
      import Button from "@atlaskit/button";
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

  it('should not transform xcss if processXcss = false', () => {
    const result = transform(
      `
      <Component xcss={{ color: 'red' }} />
    `,
      { processXcss: false }
    );

    expect(result).toMatchInlineSnapshot(`
      "<Component
        xcss={{
          color: "red",
        }}
      />;
      "
    `);
  });
});

// Note: we don't support explicitly *importing* Compiled
// in the same file as Emotion - this is something we lint against
// through the jsx-pragma rule.
//
// We only choose to worry about cases where we don't have
// two different CSS-in-JS libraries being explicitly imported,
// i.e. xcss prop, where @compiled/react isn't imported but
// @compiled/babel-plugin will still process the xcss usages.
describe('xcss prop interacting with other libraries', () => {
  it('should skip importing Compiled runtime when no direct Compiled usage was found', () => {
    const result = transform(
      `
      /** @jsx jsx */
      import { css, jsx } from '@emotion/react';
      import { Box, xcss } from '@atlaskit/primitives';
      import Button from '@atlaskit/button';

      export function Mixed() {
        return (
          <>
            <Box xcss={xcss({ color: 'red' })} />
            <div css={{ color: 'pink' }} />
          </>
        );
      }
    `
    );

    expect(result).toMatchInlineSnapshot(`
      "import { css, jsx } from "@emotion/react";
      import { Box, xcss } from "@atlaskit/primitives";
      import Button from "@atlaskit/button";
      export function Mixed() {
        return (
          <>
            <Box
              xcss={xcss({
                color: "red",
              })}
            />
            <div
              css={{
                color: "pink",
              }}
            />
          </>
        );
      }
      "
    `);
  });

  it('should import Compiled runtime when inline object is used in xcss', () => {
    const result = transform(
      `
      /** @jsx jsx */
      import { css, jsx } from '@emotion/react';
      import { Box } from '@atlaskit/primitives';

      export function Mixed() {
        return (
          <>
            <Box xcss={{ color: 'red' }} />
            <div css={{ color: 'pink' }} />
          </>
        );
      }
    `
    );

    expect(result).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      import { css, jsx } from "@emotion/react";
      import { Box } from "@atlaskit/primitives";
      const _ = "._syaz5scu{color:red}";
      export function Mixed() {
        return (
          <>
            <CC>
              <CS>{[_]}</CS>
              {<Box xcss={"_syaz5scu"} />}
            </CC>
            <div
              css={{
                color: "pink",
              }}
            />
          </>
        );
      }
      "
    `);
  });

  it("xcss prop shouldn't affect styled prop from styled-components", () => {
    const result = transform(
      `
      import { cssMap } from '@compiled/react';
      import styled from 'styled-components';
      import Button from '@atlaskit/button';

      const stylesOne = cssMap({ text: { color: 'red' } });
      const stylesTwo = cssMap({ text: { color: 'blue' } });

      const Component = styled.div\`
        color: green;
      \`;

      export function Mixed() {
        return (
          <>
            <div css={{ color: 'pink' }} />
            <Button xcss={stylesOne.text} />
            <Button xcss={stylesTwo.text} />
            <Component>hello world</Component>
          </>
        );
      }
    `
    );

    expect(result).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      import styled from "styled-components";
      import Button from "@atlaskit/button";
      const _3 = "._syaz13q2{color:blue}";
      const _2 = "._syaz5scu{color:red}";
      const _ = "._syaz32ev{color:pink}";
      const stylesOne = {
        text: "_syaz5scu",
      };
      const stylesTwo = {
        text: "_syaz13q2",
      };
      const Component = styled.div\`
        color: green;
      \`;
      export function Mixed() {
        return (
          <>
            <CC>
              <CS>{[_]}</CS>
              {<div className={ax(["_syaz32ev"])} />}
            </CC>
            <CC>
              <CS>{[_2]}</CS>
              {<Button xcss={stylesOne.text} />}
            </CC>
            <CC>
              <CS>{[_3]}</CS>
              {<Button xcss={stylesTwo.text} />}
            </CC>
            <Component>hello world</Component>
          </>
        );
      }
      "
    `);
  });
});
