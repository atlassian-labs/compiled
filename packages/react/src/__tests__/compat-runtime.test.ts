import {
  ac,
  ax,
  configurePageRuntime,
  configureRuntime,
  CS,
  getRuntimeConfig,
  resetRuntimeConfig,
  runWithRuntimeConfig,
} from '../compat-runtime';

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
        compareMode: 'off',
        matched: true,
        mismatches: [],
      })
    );
  });

  it('supports page-level config targets', () => {
    const page = {} as Record<string, unknown>;
    configurePageRuntime(page, {
      enableRuntimeStyles: false,
      mode: 'stylex',
      compareMode: 'shadow',
    });

    expect(getRuntimeConfig(page)).toEqual(
      expect.objectContaining({ enableRuntimeStyles: false, mode: 'stylex', compareMode: 'shadow' })
    );
  });

  it('can temporarily disable runtime style emission', () => {
    const rendered = runWithRuntimeConfig({ enableRuntimeStyles: false }, () =>
      CS({ children: ['._abc{color:red}'] })
    );

    expect(rendered).toBeNull();
    expect(getRuntimeConfig()).toEqual(
      expect.objectContaining({ enableRuntimeStyles: true, mode: 'compiled', compareMode: 'off' })
    );
  });

  it('runs a stylex-like shadow compare for ax when enabled', () => {
    const compare = jest.fn();
    configureRuntime({ compare, mode: 'stylex', compareMode: 'shadow' });

    const result = ax(['_aaaa1111 _bbbb1111', '_aaaa2222', 'foo', 'foo']);

    expect(result).toBe('_aaaa2222 _bbbb1111 foo');
    expect(compare).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'ax',
        result: '_aaaa2222 _bbbb1111 foo',
        shadowResult: '_aaaa2222 _bbbb1111 foo',
        compareMode: 'shadow',
        matched: true,
        mismatches: [],
      })
    );
  });

  it('reports structured mismatches for unsupported shadow operations', () => {
    const compare = jest.fn();
    configureRuntime({ compare, compareMode: 'shadow' });

    const result = ac(['_aaaa1111', '_aaaa2222']);

    expect(String(result)).toBe('_aaaa2222');
    expect(compare).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'ac',
        matched: false,
        mismatches: [
          expect.objectContaining({
            kind: 'shadow-unsupported',
          }),
        ],
      })
    );
  });

  it('reports when compare mode runs with runtime style emission disabled', () => {
    const compare = jest.fn();

    const rendered = runWithRuntimeConfig(
      { compare, compareMode: 'shadow', enableRuntimeStyles: false },
      () => CS({ children: ['._abc{color:red}'] })
    );

    expect(rendered).toBeNull();
    expect(compare).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'CS',
        matched: false,
        mismatches: [
          expect.objectContaining({
            kind: 'style-emission-skipped',
          }),
        ],
      })
    );
  });
});
