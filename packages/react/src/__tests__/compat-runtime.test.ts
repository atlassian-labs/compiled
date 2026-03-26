import { ax, configurePageRuntime, configureRuntime, CS, getRuntimeConfig, resetRuntimeConfig, runWithRuntimeConfig } from '../compat-runtime';

describe('compat runtime', () => {
  afterEach(() => {
    resetRuntimeConfig();
  });

  it('preserves ax behavior while reporting comparisons', () => {
    const compare = jest.fn();
    configureRuntime({ compare, mode: 'stylex' });

    const result = ax(['a', 'b', 'a']);

    expect(result).toBe('a b');
    expect(compare).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'ax',
        result: 'a b',
        mode: 'stylex',
      })
    );
  });

  it('supports page-level config targets', () => {
    const page = {} as Record<string, unknown>;
    configurePageRuntime(page, { enableRuntimeStyles: false, mode: 'stylex' });

    expect(getRuntimeConfig(page)).toEqual(
      expect.objectContaining({ enableRuntimeStyles: false, mode: 'stylex' })
    );
  });

  it('can temporarily disable runtime style emission', () => {
    const rendered = runWithRuntimeConfig({ enableRuntimeStyles: false }, () =>
      CS({ children: '._abc{color:red}' })
    );

    expect(rendered).toBeNull();
    expect(getRuntimeConfig()).toEqual(
      expect.objectContaining({ enableRuntimeStyles: true, mode: 'compiled' })
    );
  });
});
