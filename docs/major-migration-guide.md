# Compiled major migration platform (staged preview)

This branch introduces a reversible migration layer aimed at the next major version of Compiled.

## Goals of this slice

- **No-op upgrade path:** upgrading without changing config keeps the current `@compiled/react/runtime` output.
- **Bundler/plugin switch:** set `outputMode: 'compat'` to point generated runtime imports at `@compiled/react/compat-runtime`.
- **Runtime flags:** use the compat runtime to enable comparison hooks and behavior flags globally or per page.
- **Codemod support:** use `runtime-to-compat` to rewrite handwritten runtime imports.
- **End-state ready:** after the staged flow, the remaining swap to StyleX can happen behind the compat layer instead of in one big bang.

## Stage 0 — upgrade with no code changes

Do nothing. The compiler still inserts:

```ts
import { ax, ix, CC, CS } from '@compiled/react/runtime';
```

That preserves today's behavior.

## Stage 1 — switch generated runtime output to compat

### Babel

```js
['@compiled/babel-plugin', { outputMode: 'compat' }];
```

### Vite

```ts
compiled({ outputMode: 'compat' });
```

### Webpack loader

```js
{
  loader: '@compiled/webpack-loader',
  options: {
    outputMode: 'compat',
  },
}
```

This changes generated imports to:

```ts
import { ax, ix, CC, CS } from '@compiled/react/compat-runtime';
```

The compat runtime delegates to the existing runtime so behavior stays the same.

## Stage 2 — add runtime instrumentation / flags

```ts
import { configureRuntime, configurePageRuntime } from '@compiled/react/compat-runtime';

configureRuntime({
  mode: 'stylex',
  compareMode: 'shadow',
  compare(payload) {
    if (!payload.matched) {
      console.log('[compiled-compare]', payload.operation, payload.mismatches);
    }
  },
});

configurePageRuntime(window, {
  enableRuntimeStyles: false,
});
```

Available controls in this slice:

- `mode: 'compiled' | 'stylex'` — tracks the target semantics you are comparing against.
- `compareMode: 'off' | 'shadow'` — `shadow` runs a secondary StyleX-like compare path where available and reports mismatches without changing primary behavior.
- `enableRuntimeStyles: boolean` — can suppress compat runtime style emission for controlled experiments.
- `compare(payload)` — called after compat runtime operations execute.

### Compare payload shape

```ts
type RuntimeCompareMismatch = {
  kind: 'result-mismatch' | 'style-emission-skipped' | 'shadow-unsupported' | 'shadow-error';
  message: string;
  details?: Record<string, unknown>;
};

type RuntimeComparePayload = {
  operation: string;
  args: unknown[];
  result: unknown;
  shadowResult?: unknown;
  matched: boolean;
  mismatches: RuntimeCompareMismatch[];
  mode: 'compiled' | 'stylex';
  compareMode: 'off' | 'shadow';
  flags: CompiledRuntimeConfig;
};
```

Current shadow coverage in this slice:

- `ax`: real dual execution against a StyleX-like class merge model
- `ix`: dual execution currently mirrors the existing runtime (mainly validating compare plumbing)
- `ac`, `CC`: emit `shadow-unsupported` while the shadow runtime is still incomplete
- `CS`: reports `style-emission-skipped` when compare mode is enabled but primary style emission has been disabled

This is intentionally conservative: compare mode is observational only and defaults to `off`.

## Stage 3 — codemod handwritten runtime imports

```bash
npx @hypermod/cli --packages @compiled/codemods --transform runtime-to-compat src/**/*.tsx
```

This rewrites manual imports from `@compiled/react/runtime` to `@compiled/react/compat-runtime`.

## Stage 4 — prepare for StyleX swap

Once your app is stable on:

- compat-generated output,
- compat runtime config,
- codemodded manual runtime imports,
- compare-mode mismatch reporting,

...the remaining work is to swap the compat implementation from Compiled-backed behavior to StyleX-backed behavior, while keeping the same runtime config surface.

## What is fully implemented in this slice

- compiler/runtime import source plumbing
- bundler option surface (`outputMode`, `runtimeImportSource`)
- compat runtime entrypoint
- global and page-scoped runtime config APIs
- comparison hook plumbing
- structured mismatch taxonomy + compare payloads
- shadow compare execution for `ax`
- safe default compare behavior (`compareMode: 'off'`)
- real codemod for manual runtime imports
- tests for default output, compat output, override output, and runtime flags

## What is scaffolded / next

- actual StyleX-backed compat runtime internals (current compare path is StyleX-like/shadow, not the real runtime)
- broader shadow coverage for `ac`, `CC`, and `CS`
- page/component-scoped React provider APIs
- broader codemod coverage for JSX/runtime edge cases
- docs integrated into the public docs site
