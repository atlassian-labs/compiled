import { transformSync } from '@babel/core';
import babelPlugin from '../index';

const transform = (code: string) => {
  return transformSync(code, {
    configFile: false,
    babelrc: false,
    compact: true,
    plugins: [babelPlugin],
  })?.code;
};

describe('import specifiers', () => {
  it('should evaluate simple expressions', () => {
    const actual = transform(`
      import '@compiled/react';
      import React from 'react';

      <div css={{ fontSize: 8 * 2 }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:16px}');
  });

  it('should inline mutable identifier that is not mutated', () => {
    const actual = transform(`
      import '@compiled/react';
      import React from 'react';

      let notMutatedAgain = 20;

      <div css={{ fontSize: notMutatedAgain }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:20px}');
  });

  it('should bail out evaluating expression referencing a mutable identifier', () => {
    const actual = transform(`
      import '@compiled/react';
      import React from 'react';

      let mutable = 2;
      mutable = 1;

      <div css={{ fontSize: mutable }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:var(--_i47brp)}');
  });

  it('should bail out evaluating identifier expression referencing a mutated identifier', () => {
    const actual = transform(`
      import '@compiled/react';
      import React from 'react';

      let mutable = 2;
      const dontchange = mutable;
      mutable = 3;

      <div css={{ fontSize: dontchange }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:var(--_uta6jk)}');
  });

  it('should not exhaust the stack when an identifier references itself', () => {
    expect(() => {
      transform(`
      import '@compiled/react';
      import React from 'react';

      let heading = heading || 20;

      <div css={{ marginLeft: \`\${heading.depth}rem\`, color: 'red' }}>hello world</div>
    `);
    }).not.toThrow();
  });

  it('should bail out evaluating expression that references a constant expression referencing a mutated expression', () => {
    const actual = transform(`
      import '@compiled/react';
      import React from 'react';

      let mutable = false;
      const dontchange = mutable ? 1 : 2;
      mutable = true;

      <div css={{ fontSize: dontchange }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:var(--_uta6jk)}');
  });

  it('should bail out evaluating a binary expression referencing a mutated identifier', () => {
    const actual = transform(`
      import '@compiled/react';
      import React from 'react';

      let mutable = 2;
      mutable = 3;

      <div css={{ fontSize: mutable * 2 }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:var(--_1bs2x4k)}');
  });

  it('should not blow up when referencing local destructured args in arrow func', () => {
    expect(() => {
      transform(
        `
        import '@compiled/react';

        export const Component = ({ foo, color }) => {
          return (
            <span css={{ fontSize: foo, color, backgroundColor: 'blue' }} />
          );
        };
    `
      );
    }).not.toThrow();
  });

  it('should not blow up when referencing local args in arrow func', () => {
    expect(() => {
      transform(
        `
        import '@compiled/react';

        export const Component = (props) => {
          return (
            <span css={{ fontSize: props.foo, color: props.color, backgroundColor: 'blue' }} />
          );
        };
    `
      );
    }).not.toThrow();
  });

  it('should not blow up when referencing local destructured args in func', () => {
    expect(() => {
      transform(
        `
        import '@compiled/react';

        function Component({ foo, color }) {
          return (
            <span css={{ fontSize: foo, color, backgroundColor: 'blue' }} />
          );
        };
    `
      );
    }).not.toThrow();
  });

  it('should not blow up when referencing local args in func', () => {
    expect(() => {
      transform(
        `
        import '@compiled/react';

        function Component(props) {
          return (
            <span css={{ fontSize: props.foo, color: props.color, backgroundColor: 'blue' }} />
          );
        };
    `
      );
    }).not.toThrow();
  });

  it('should not blow up when destructured local args in func', () => {
    expect(() => {
      transform(
        `
      import '@compiled/react';

      function DestructuredComp(props) {
        const { foo, color } = props;

        return (
          <span css={{ fontSize: foo, color: color, backgroundColor: 'blue' }} />
        );
      };
    `
      );
    }).not.toThrow();
  });

  it('handles object destructuring', () => {
    const actual = transform(`
      import '@compiled/react';
      import React from 'react';

      const { foo, color } = { foo: 14, color: 'blue' };

      function Component() {
        return (
          <span css={{ fontSize: foo, color: color, backgroundColor: 'blue' }} />
        );
      };
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:14px}',
      '{color:blue}',
      '{background-color:blue}',
    ]);
  });

  it('handles the destructuring coming from an identifier', () => {
    const actual = transform(`
      import '@compiled/react';
      import React from 'react';

      const obj = { foo: 14, color: 'blue' };
      const { foo, color } = obj;

      function Component() {
        return (
          <span css={{ fontSize: foo, color: color, backgroundColor: 'blue' }} />
        );
      };
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:14px}',
      '{color:blue}',
      '{background-color:blue}',
    ]);
  });

  it('handles the destructuring coming from a referenced identifier', () => {
    const actual = transform(`
      import '@compiled/react';
      import React from 'react';

      const obj = { foo: 14, color: 'blue' };
      const bar = obj;
      const { foo, color } = bar;

      function Component() {
        return (
          <span css={{ fontSize: foo, color: color, backgroundColor: 'blue' }} />
        );
      };
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:14px}',
      '{color:blue}',
      '{background-color:blue}',
    ]);
  });

  it('handles the function call destructuring coming from a referenced identifier', () => {
    const actual = transform(`
      import '@compiled/react';
      import React from 'react';

      const obj = { foo: () => ({ bar: 14 }), color: 'blue' };
      const bar = obj;
      const { foo, color } = bar;

      function Component() {
        return (
          <span css={{ fontSize: foo().bar, color: color, backgroundColor: 'blue' }} />
        );
      };
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:14px}',
      '{color:blue}',
      '{background-color:blue}',
    ]);
  });

  it('should not blow up when member expression object is other than "Identifier" or "Call Expression"', () => {
    expect(() => {
      transform(`
      import '@compiled/react';
      import React from 'react';

      function Component() {
        return (
          <span css={{ width: [{ bar: 10 }][0].bar }} />
        );
      };
    `);
    }).not.toThrow();
  });
});
