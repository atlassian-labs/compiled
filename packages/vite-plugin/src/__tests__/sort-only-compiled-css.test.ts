/**
 * @jest-environment node
 */

import { execFileSync } from 'child_process';
import { join } from 'path';

const font = '._11c8wadc{font:var(--ds-font-body-small)}';
const fontWeight = '._k48pwu06{font-weight:var(--ds-font-weight-bold,653)}';
const authored = '.a{padding-left:4px}.a{padding:0}';

type Asset = { name: string; source: string };

// Vite's Node API is ESM and uses esbuild, which does not work inside Jest, so each
// scenario builds a small fixture in a child process (as the dev CSS test does).
const runBuild = (scenario: string): { css?: Asset[]; error?: string } =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [join(__dirname, '__fixtures__/sort-only-compiled-css/run-build.cjs'), scenario],
      {
        cwd: join(__dirname, '../../../..'),
        encoding: 'utf8',
        env: { ...process.env, NODE_NO_WARNINGS: '1', VITE_CJS_IGNORE_WARNING: '1' },
      }
    )
  );

describe('sortOnlyCompiledCss', () => {
  it('emits the .compiled.css modules as their own asset and sorts only that asset', () => {
    const css = runBuild('compiled-only').css!;
    const compiled = css.find((file) => /compiled-css/.test(file.name));
    const other = css.filter((file) => file !== compiled);

    expect(compiled?.source).toBe(`${font}${fontWeight}`);
    expect(other).toHaveLength(1);
    expect(other[0].source).toBe(authored);
  });

  it('sorts the whole stylesheet by default, including authored rules', () => {
    const css = runBuild('default').css!;

    expect(css).toHaveLength(1);
    expect(css[0].source).not.toContain(authored);
  });

  it('keeps chunking from a user-provided manualChunks function', () => {
    const css = runBuild('user-manual-chunks').css!;

    expect(css.find((file) => /compiled-css/.test(file.name))?.source).toBe(`${font}${fontWeight}`);
    expect(css.find((file) => /authored/.test(file.name))?.source).toBe(authored);
  });

  it('throws a clear error for an object-form manualChunks', () => {
    expect(runBuild('object-manual-chunks').error).toContain(
      'cannot be combined with an object-form'
    );
  });
});
