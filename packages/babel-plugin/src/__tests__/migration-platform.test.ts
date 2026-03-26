import { transform } from '../test-utils';

describe('migration platform runtime output', () => {
  it('preserves the existing runtime import by default', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      const Box = styled.div({ color: 'red' });
    `);

    expect(actual).toInclude('from "@compiled/react/runtime"');
  });

  it('can switch generated output to the compat runtime', () => {
    const actual = transform(
      `
      import { styled } from '@compiled/react';
      const Box = styled.div({ color: 'red' });
    `,
      { outputMode: 'compat' }
    );

    expect(actual).toInclude('from "@compiled/react/compat-runtime"');
  });

  it('allows explicitly overriding the runtime import source', () => {
    const actual = transform(
      `
      import { styled } from '@compiled/react';
      const Box = styled.div({ color: 'red' });
    `,
      { outputMode: 'compat', runtimeImportSource: '@company/compiled-runtime' }
    );

    expect(actual).toInclude('from "@company/compiled-runtime"');
    expect(actual).not.toInclude('@compiled/react/compat-runtime');
  });
});
