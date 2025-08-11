const path = require('path');

const swc = require('@swc/core');

/**
 * Transform code using our SWC plugin
 */
async function transform(code, options = {}) {
  const wasmPath = path.join(__dirname, '..', 'compiled_swc_plugin.wasm');

  const pluginOptions = {
    processXcss: true,
    importSources: ['@compiled/react'],
    strictMode: true, // Enable strict mode
    ...options,
  };

  try {
    const result = await swc.transform(code, {
      filename: 'test.tsx',
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        experimental: {
          plugins: [[wasmPath, pluginOptions]],
        },
      },
    });

    return result.code;
  } catch (error) {
    throw error;
  }
}

// Helper to always return a string snapshot: transformed code or error string
async function transformResultString(code, options = {}) {
  try {
    const output = await transform(code, options);
    return normalizeOutput(output);
  } catch (error) {
    return normalizeOutput(String(error));
  }
}

function normalizeOutput(str) {
  return str.replace(
    /packages\/swc-plugin\/compiled_swc_plugin\.wasm/g,
    'packages/swc-plugin2/compiled_swc_plugin2.wasm'
  );
}

/**
 * Utility to check if a string contains expected patterns
 */
function expectToContain(result, patterns) {
  if (typeof patterns === 'string') {
    patterns = [patterns];
  }

  for (const pattern of patterns) {
    if (!result.includes(pattern)) {
      throw new Error(
        `Expected result to contain "${pattern}" but it didn't.\nActual result:\n${result}`
      );
    }
  }
  return true;
}

/**
 * Utility to check if a string does NOT contain patterns
 */
function expectNotToContain(result, patterns) {
  if (typeof patterns === 'string') {
    patterns = [patterns];
  }

  for (const pattern of patterns) {
    if (result.includes(pattern)) {
      throw new Error(
        `Expected result NOT to contain "${pattern}" but it did.\nActual result:\n${result}`
      );
    }
  }
  return true;
}

/**
 * Utility to check if transformation throws an error
 */
async function expectToThrow(code, options = {}) {
  let threwError = false;
  let error = null;
  try {
    await transform(code, options);
  } catch (e) {
    threwError = true;
    error = e;
  }

  if (!threwError) {
    throw new Error('Expected transformation to throw an error, but it did not');
  }
  return error;
}

describe('Strict Mode - SWC Plugin', () => {
  describe('css() - Supported Static Functionality', () => {
    it('should transform basic css with static object literal', async () => {
      const code = `
        import { css } from '@compiled/react';
        
        const styles = css({
          color: 'red',
          fontSize: 14,
          backgroundColor: 'blue'
        });
      `;
      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "import * as React from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        var _3 = "._qhg11u{background-color:blue}";
        var _2 = "._1it30mr{font-size:14px}";
        var _ = "._jpi694{color:red}";
        var styles = null;
        "
      `);
    });

    it('should transform css prop with static object literal', async () => {
      const code = `
        import '@compiled/react';
        
        <div css={{
          color: 'red',
          fontSize: 14,
          padding: '10px'
        }}>Hello</div>
      `;
      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "import * as React1 from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        var _3 = "._1ojmb8f{padding:10px}";
        var _2 = "._1it30mr{font-size:14px}";
        var _ = "._jpi694{color:red}";
        /*#__PURE__*/ React.createElement("div", {
            className: ax([
                "_jpi694",
                "_1it30mr",
                "_1ojmb8f"
            ])
        }, "Hello");
        "
      `);
    });

    it('should transform css prop with string literal', async () => {
      const code = `
        import '@compiled/react';
        
        <div css="color: red; font-size: 14px;">Hello</div>
      `;
      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "import * as React1 from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        var _2 = "._1elxrq9{font-size: 14px}";
        var _ = "._1wszpi4{color: red}";
        /*#__PURE__*/ React.createElement("div", {
            className: ax([
                "_1wszpi4",
                "_1elxrq9"
            ])
        }, "Hello");
        "
      `);
    });

    it('should handle nested objects for pseudo-selectors', async () => {
      const code = `
        import { css } from '@compiled/react';
        
        const styles = css({
          color: 'red',
          ':hover': {
            color: 'blue',
            backgroundColor: 'yellow'
          }
        });
      `;
      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "import * as React from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        var _3 = "._1rldtxs:hover{background-color:yellow}";
        var _2 = "._1yoobt8:hover{color:blue}";
        var _ = "._jpi694{color:red}";
        var styles = null;
        "
      `);
    });

    it('should handle media queries with static values', async () => {
      const code = `
        import '@compiled/react';
        
        <div css={{
          color: 'red',
          '@media screen': {
            color: 'blue',
            fontSize: 16
          }
        }}>Hello</div>
      `;
      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "import * as React1 from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        var _3 = "@media screen{._y3kiq7{font-size:16px}}";
        var _2 = "@media screen{._1yoobt8{color:blue}}";
        var _ = "._jpi694{color:red}";
        /*#__PURE__*/ React.createElement("div", {
            className: ax([
                "_jpi694",
                "_1yoobt8",
                "_y3kiq7"
            ])
        }, "Hello");
        "
      `);
    });
  });

  describe('cssMap() - Supported Static Functionality', () => {
    it('should transform basic cssMap with static values', async () => {
      const code = `
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          primary: {
            color: 'red',
            backgroundColor: 'blue'
          },
          secondary: {
            color: 'green',
            fontSize: 14
          }
        });
      `;
      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "import * as React from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        var _4 = "._1it30mr{font-size:14px}";
        var _3 = "._1ulwugp{color:green}";
        var _2 = "._qhg11u{background-color:blue}";
        var _ = "._jpi694{color:red}";
        var styles = {
            primary: "_jpi694 _qhg11u",
            secondary: "_1ulwugp _1it30mr"
        };
        "
      `);
    });

    it('should transform cssMap usage in css prop', async () => {
      const code = `
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: {
            color: 'red',
            backgroundColor: 'red'
          },
          success: {
            color: 'green',
            backgroundColor: 'green'
          }
        });

        const Component = () => <div>
          <span css={styles.danger} />
          <span css={styles.success} />
        </div>
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "import * as React1 from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        var _4 = "._uo4p87{background-color:green}";
        var _3 = "._1ulwugp{color:green}";
        var _2 = "._1u1ezxk{background-color:red}";
        var _ = "._jpi694{color:red}";
        var styles = {
            danger: "_jpi694 _1u1ezxk",
            success: "_1ulwugp _uo4p87"
        };
        var Component = function() {
            return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("span", {
                className: ax([
                    styles.danger
                ])
            }), /*#__PURE__*/ React.createElement("span", {
                className: ax([
                    styles.success
                ])
            }));
        };
        "
      `);
    });

    it('should handle empty cssMap variants', async () => {
      const code = `
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          empty: {},
          filled: {
            color: 'red'
          }
        });
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "import * as React from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        var _ = "._jpi694{color:red}";
        var styles = {
            empty: "",
            filled: "_jpi694"
        };
        "
      `);
    });

    it('should handle cssMap with pseudo-selectors and media queries', async () => {
      const code = `
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          interactive: {
            color: 'blue',
            ':hover': {
              color: 'red'
            },
            '@media screen': {
              fontSize: 16
            }
          }
        });
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "import * as React from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        var _3 = "@media screen{._y3kiq7{font-size:16px}}";
        var _2 = "._jpi694:hover{color:red}";
        var _ = "._1yoobt8{color:blue}";
        var styles = {
            interactive: "_1yoobt8 _jpi694 _y3kiq7"
        };
        "
      `);
    });
  });

  describe('Strict Mode Restrictions - Should NOT Transform', () => {
    it('should not transform css with dynamic variables', async () => {
      const code = `
        import { css } from '@compiled/react';
        import color from './module';
        
        const styles = css({
          color: color
        });
      `;
      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "Error: failed to handle: failed to invoke plugin: failed to invoke plugin on 'Some("test.tsx")'

        Caused by:
            0: failed to invoke \`/Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm\` as js transform plugin at /Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm
            1: RuntimeError: unreachable"
      `);
    });

    it('should not transform css with function calls', async () => {
      const code = `
        import { css } from '@compiled/react';
        
        const styles = css({
          color: getColor()
        });
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "Error: failed to handle: failed to invoke plugin: failed to invoke plugin on 'Some("test.tsx")'

        Caused by:
            0: failed to invoke \`/Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm\` as js transform plugin at /Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm
            1: RuntimeError: unreachable"
      `);
    });

    it('should not transform css with binary expressions', async () => {
      const code = `
        import { css } from '@compiled/react';
        
        const styles = css({
          width: 1 + 1 + "px"
        });
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "Error: failed to handle: failed to invoke plugin: failed to invoke plugin on 'Some("test.tsx")'

        Caused by:
            0: failed to invoke \`/Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm\` as js transform plugin at /Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm
            1: RuntimeError: unreachable"
      `);
    });

    it('should not transform css with member expressions', async () => {
      const code = `
        import { css } from '@compiled/react';
        
        const theme = { colors: { primary: 'red' } };
        const styles = css({
          color: theme.colors.primary
        });
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "Error: failed to handle: failed to invoke plugin: failed to invoke plugin on 'Some("test.tsx")'

        Caused by:
            0: failed to invoke \`/Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm\` as js transform plugin at /Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm
            1: RuntimeError: unreachable"
      `);
    });

    it('should not transform cssMap with dynamic values', async () => {
      const code = `
        import { cssMap } from '@compiled/react';
        
        const primaryColor = 'red';
        const styles = cssMap({
          primary: {
            color: primaryColor
          }
        });
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "Error: failed to handle: failed to invoke plugin: failed to invoke plugin on 'Some("test.tsx")'

        Caused by:
            0: failed to invoke \`/Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm\` as js transform plugin at /Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm
            1: RuntimeError: unreachable"
      `);
    });

    it('should not transform cssMap with function calls', async () => {
      const code = `
        import { cssMap } from '@compiled/react';
        
        const styles = cssMap({
          primary: {
            color: getColor()
          }
        });
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "Error: failed to handle: failed to invoke plugin: failed to invoke plugin on 'Some("test.tsx")'

        Caused by:
            0: failed to invoke \`/Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm\` as js transform plugin at /Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm
            1: RuntimeError: unreachable"
      `);
    });

    it('should not transform styled components', async () => {
      const code = `
        import { styled } from '@compiled/react';
        
        const Button = styled.div\`
          color: red;
        \`;
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "function _tagged_template_literal(strings, raw) {
            if (!raw) {
                raw = strings.slice(0);
            }
            return Object.freeze(Object.defineProperties(strings, {
                raw: {
                    value: Object.freeze(raw)
                }
            }));
        }
        function _templateObject() {
            var data = _tagged_template_literal([
                "\\n          color: red;\\n        "
            ]);
            _templateObject = function _templateObject() {
                return data;
            };
            return data;
        }
        import * as React from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        import { styled } from "@compiled/react";
        var Button = styled.div(_templateObject());
        "
      `);
    });

    it('should not transform styled component calls', async () => {
      const code = `
        import { styled } from '@compiled/react';
        
        const Button = styled('div')({
          color: 'red'
        });
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "import * as React from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        import { styled } from "@compiled/react";
        var Button = styled("div")({
            color: "red"
        });
        "
      `);
    });
  });

  describe('Edge Cases', () => {
    it('should handle mixed static and dynamic (only transform static)', async () => {
      // Test that static parts work while dynamic parts are ignored
      const code = `
        import '@compiled/react';
        
        const dynamicColor = 'red';
        <div css={{
          color: 'blue',        // static - should work
          fontSize: 14,         // static - should work  
          backgroundColor: dynamicColor  // dynamic - should not work
        }}>Hello</div>
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "Error: failed to handle: failed to invoke plugin: failed to invoke plugin on 'Some("test.tsx")'

        Caused by:
            0: failed to invoke \`/Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm\` as js transform plugin at /Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm
            1: RuntimeError: unreachable"
      `);
    });

    it('should handle cssMap with mixed static and dynamic variants', async () => {
      const code = `
        import { cssMap } from '@compiled/react';
        
        const dynamicColor = 'red';
        const styles = cssMap({
          static: {
            color: 'blue',
            fontSize: 14
          },
          dynamic: {
            color: dynamicColor
          }
        });
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "Error: failed to handle: failed to invoke plugin: failed to invoke plugin on 'Some("test.tsx")'

        Caused by:
            0: failed to invoke \`/Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm\` as js transform plugin at /Users/sjackson3/Documents/atlassian/compiled-perf-fork/packages/swc-plugin2/compiled_swc_plugin2.wasm
            1: RuntimeError: unreachable"
      `);
    });
  });

  describe('Comparison with Babel Plugin Behavior', () => {
    it('should produce same output as babel plugin for basic css', async () => {
      const code = `
        import { css } from '@compiled/react';
        
        const styles = css({
          color: 'red',
          fontSize: 14
        });
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "import * as React from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        var _2 = "._1it30mr{font-size:14px}";
        var _ = "._jpi694{color:red}";
        var styles = null;
        "
      `);
    });

    it('should produce same output as babel plugin for basic cssMap', async () => {
      const code = `
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: {
            color: 'red',
            backgroundColor: 'red'
          },
          success: {
            color: 'green',
            backgroundColor: 'green'
          }
        });

        const Component = () => <div>
          <span css={styles.danger} />
          <span css={styles.success} />
        </div>
      `;

      const out = await transformResultString(code);
      expect(out).toMatchInlineSnapshot(`
        "import * as React1 from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        var _4 = "._uo4p87{background-color:green}";
        var _3 = "._1ulwugp{color:green}";
        var _2 = "._1u1ezxk{background-color:red}";
        var _ = "._jpi694{color:red}";
        var styles = {
            danger: "_jpi694 _1u1ezxk",
            success: "_1ulwugp _uo4p87"
        };
        var Component = function() {
            return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("span", {
                className: ax([
                    styles.danger
                ])
            }), /*#__PURE__*/ React.createElement("span", {
                className: ax([
                    styles.success
                ])
            }));
        };
        "
      `);
    });
  });
});
