import { transform as transformCode } from '../test-utils';

describe('error handling', () => {
  const transform = (code: string) =>
    transformCode(code, {
      // Turn off code highlighting so snapshots are human readable.
      highlightCode: false,
    });

  it('should throw when using using an invalid css node', () => {
    expect(() => {
      transform(`
        import '@compiled/react';

        <div css={() => {}} />
      `);
    }).toThrowErrorMatchingInlineSnapshot(`
      "unknown file: This ArrowFunctionExpression was unable to have its styles extracted — no Compiled APIs were found in scope, if you're using createStrictAPI make sure to configure importSources (4:18).
        2 |         import '@compiled/react';
        3 |
      > 4 |         <div css={() => {}} />
          |                   ^^^^^^^^
        5 |       "
    `);
  });

  it('should throw when spreading an identifier that does not exist', () => {
    expect(() => {
      transform(`
        import '@compiled/react';

        <div css={{ ...dontexist }} />
      `);
    }).toThrowErrorMatchingInlineSnapshot(`
      "unknown file: Variable could not be found (4:23).
        2 |         import '@compiled/react';
        3 |
      > 4 |         <div css={{ ...dontexist }} />
          |                        ^^^^^^^^^
        5 |       "
    `);
  });

  it('should throw when referencing an identifier that does not exist', () => {
    expect(() => {
      transform(`
        import '@compiled/react';

        <div css={dontexist} />
      `);
    }).toThrowErrorMatchingInlineSnapshot(`
      "unknown file: Variable could not be found (4:18).
        2 |         import '@compiled/react';
        3 |
      > 4 |         <div css={dontexist} />
          |                   ^^^^^^^^^
        5 |       "
    `);
  });

  it('should throw when referencing an identifier that isnt supported', () => {
    expect(() => {
      transform(`
        import '@compiled/react';

        class HelloWorld {}

        <div css={HelloWorld} />
      `);
    }).toThrowErrorMatchingInlineSnapshot(`
      "unknown file: ClassDeclaration isn't a supported CSS type - try using an object or string (6:18).
        4 |         class HelloWorld {}
        5 |
      > 6 |         <div css={HelloWorld} />
          |                   ^^^^^^^^^^
        7 |       "
    `);
  });

  it('should throw when composing invalid css', () => {
    expect(() => {
      transform(`
        import '@compiled/react';

        <div css={[...hello]} />
      `);
    }).toThrowErrorMatchingInlineSnapshot(`
      "unknown file: SpreadElement isn't a supported CSS type - try using an object or string (4:18).
        2 |         import '@compiled/react';
        3 |
      > 4 |         <div css={[...hello]} />
          |                   ^^^^^^^^^^
        5 |       "
    `);
  });
});
