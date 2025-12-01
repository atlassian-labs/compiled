# Project Overview

Compiled is a **compile-time CSS-in-JS library** for React that transforms styled components into atomic CSS at build time via Babel AST transformations. Unlike runtime CSS-in-JS libraries, all styles are extracted and processed during compilation.

**Core principle**: Zero runtime CSS generation. All styles are determined at build time through static analysis and AST manipulation.

# Architecture

## Monorepo Structure

Yarn workspaces monorepo with three main workspace types:

- `packages/*` - Core libraries published to npm
- `examples/*` - Example integrations (webpack, parcel, ssr)
- `fixtures/*` - Test fixtures and babel component examples

**Critical packages**:

- `packages/babel-plugin/` - Core Babel transformation engine (AST processing)
- `packages/react/` - Runtime library with `ax`, `ix`, `CC`, `CS` utilities
- `packages/css/` - CSS parsing, sorting, and atomic stylesheet generation
- `packages/webpack-loader/`, `packages/parcel-transformer/` - Bundler integrations
- `packages/babel-plugin-strip-runtime/` - Extracts styles to separate `.compiled.css` files
- `packages/codemods/` - Migration tools (emotion→compiled, styled-components→compiled)
- `packages/eslint-plugin/` - ESLint rules for enforcing Compiled best practices
- `packages/jest/` - Jest testing utilities and matchers
- `packages/utils/` - Shared utilities across packages
- `packages/benchmark/` - Performance benchmarking tools

## Build System

Uses TypeScript with **ttsc** (TypeScript Transformer Compiler) instead of plain `tsc`:

```bash
# Build order matters - babel fixtures first, then browser/cjs/esm
yarn build:babel-fixture  # Compile test fixtures
yarn build:cjs            # CommonJS output (packages/tsconfig.json)
yarn build:esm            # ES modules (packages/tsconfig.esm.json)
yarn build:browser        # Browser bundles (packages/tsconfig.browser.json)
```

Post-build: `scripts/postbuild.sh` removes `__tests__/` and `__perf__/` from dist.

## Atomic CSS System

**Key concept**: One CSS rule per declaration. Class names encode both the atomic group (property+selectors+media) and value.

Format: `_{group}{value}` where group is 4 chars and value is 4+ chars (e.g., `_1wyb1fwx` for `font-size:12px`). The underscore + 4-char group makes `ATOMIC_GROUP_LENGTH = 5` in code.

**Runtime utilities** (`packages/react/src/runtime/`):

- `ax()` - Merges classnames, ensures last atomic group wins (handles composition)
- `ac()` - Advanced merging with AtomicGroups (chainable, memoized)
- `ix()` - Injects CSS variables for dynamic values
- `CC`, `CS` - Components for style sheet injection

**Auto-ordering**: Pseudo-classes sorted to prevent cascade issues (`:link` → `:visited` → `:focus-within` → `:focus` → `:hover` → `:active`)

# User-Facing APIs

Main exports from `@compiled/react`:

- `styled` - Create styled components (e.g., `styled.div({ color: 'red' })`)
- `css` - Define styles for css prop (e.g., `css({ color: 'red' })`)
- `cssMap` - Create CSS maps for conditional styling
- `ClassNames` - Render prop component for dynamic className generation
- `keyframes` - Define CSS animations
- `xcss` / `cx()` - Strict-typed CSS system (Atlassian design system integration)
- `createStrictAPI()` - Create type-safe CSS APIs with restricted properties

See `packages/react/src/index.ts` for all exports.

# Critical Workflows

## Development

```bash
yarn install              # Install + postinstall.sh (sets up tooling)
yarn start                # Storybook on :6006 (watch babel-plugin changes)
yarn test <filter> --watch  # Run specific tests
yarn test:cover           # Coverage report
yarn test:vr              # Visual regression tests with Loki (requires Storybook running)
yarn benchmark            # Run performance benchmarks
yarn lint                 # Run ESLint
yarn prettier:check       # Check code formatting
```

## Testing Patterns

**Unit tests**:

- Test files: `packages/*/src/**/*.test.{ts,tsx}`
- Perf tests: `__perf__/*.test.ts`
- Use `transform()` helper from `test-utils.ts` for Babel plugin tests
- Babel plugin tests check transformed output with `.toMatchInlineSnapshot()`
- Use `toHaveCompiledCss()` matcher from `@compiled/jest`

**Visual regression tests**:

- Uses Loki with Storybook
- Run `yarn test:vr` (requires `yarn start` running in another terminal)
- Accept changes with `yarn test:vr approve`

**Performance tests**:

- Benchmark files in `__perf__/` directories
- Run with `yarn benchmark`

## Working with Babel Plugin

**Essential tool**: [astexplorer.net](https://astexplorer.net) - Use Babel 7 parser to visualize AST

**Key transformation flow**:

1. Parse JSX/TSX with Babel (`@babel/parser`)
2. Traverse AST to find Compiled imports (`styled`, `css`, `cssMap`, `ClassNames`, `keyframes`)
3. `buildCss()` - Extract styles from expressions (objects/template literals)
4. `transformCssItems()` - Convert to atomic CSS rules
5. `buildStyledComponent()` / `buildCompiledComponent()` - Generate runtime code
6. `appendRuntimeImports()` - Add necessary runtime imports (`ax`, `ix`, `CC`, `CS`)

**Common utilities** (`packages/babel-plugin/src/utils/`):

- `css-builders.ts` - `buildCss()` main entry point
- `build-styled-component.ts` - Generates `forwardRef` components
- `transform-css-items.ts` - Converts styles to sheet/classname pairs
- `ast.ts` - AST manipulation helpers

## CSS Extraction (Production)

Two-phase transformation:

1. `@compiled/babel-plugin` - Transform CSS-in-JS to runtime code
2. `@compiled/babel-plugin-strip-runtime` - Extract styles to `.compiled.css`

Configure in `.babelrc`:

```json
{
  "plugins": [
    ["@compiled/babel-plugin"],
    [
      "@compiled/babel-plugin-strip-runtime",
      {
        "extractStylesToDirectory": { "source": "src", "dest": "dist" }
      }
    ]
  ]
}
```

**Important**: Add `"sideEffects": ["**/*.compiled.css"]` to package.json to prevent tree-shaking.

## Changesets for Releases

```bash
yarn changeset              # Create changeset (select minor/patch)
yarn release                # Build + publish (CI only)
```

- `minor` for new features, `patch` for bug fixes
- Changesets live in `.changeset/` directory

# Project Conventions

## Import Sources

Default import sources: `@compiled/react` (configurable via `importSources` option)

Supports custom import sources for Atlassian internal packages.

## Module Resolution

Babel plugin uses synchronous resolver (via `enhanced-resolve`) to statically evaluate imports. Custom resolvers configurable via plugin options.

## Dynamic Styles via CSS Variables

Dynamic values injected as CSS variables:

```jsx
// Input
<div css={{ color: props.color }} />

// Output
<div
  style={{ "--_xyz": props.color }}
  className="_abc123"
/>
// CSS: ._abc123 { color: var(--_xyz); }
```

## File Naming

- Test files: `*.test.ts` (not `*.spec.ts`)
- Perf tests: `__perf__/*.test.ts`
- Fixtures: `__fixtures__/` directories
- Parcel-specific tests: `*.parceltest.ts`

## Code Quality

- ESLint: `@compiled/eslint-plugin` provides 12+ rules for best practices
  - Recommended config: `plugin:@compiled/recommended`
  - Key rules: `no-css-tagged-template-expression`, `no-js-xcss`, `shorthand-property-sorting`
- Prettier: Enforced via `yarn prettier:check` / `yarn prettier:fix`
- TypeScript: Strict mode enabled, uses `ttsc` for custom transformers
- Pre-commit hooks: Auto-runs lint and prettier via Husky

## Style Buckets

Styles injected in ordered buckets for cascade control:

1. Default rules
2. Link pseudo-selectors (`:link`, `:visited`)
3. Focus pseudo-selectors (`:focus-within`, `:focus`, `:focus-visible`)
4. Interaction pseudo-selectors (`:hover`, `:active`)
5. At-rules (media queries - sorted mobile-first)

See `packages/react/src/runtime/style.tsx` for bucket implementation.

# Common Pitfalls

1. **Double transformation**: Don't use both webpack-loader AND babel-plugin in babel config
2. **AST type confusion**: Use `t.isIdentifier()` etc. before accessing node properties
3. **Test snapshots**: Update with `--updateSnapshot` flag, not manual edits
4. **Babel config in tests**: Always set `babelrc: false, configFile: false` to prevent inheritance
5. **Atomic class deduplication**: Remember `ax()` uses last-wins strategy for same atomic group
6. **xcss without TypeScript**: The xcss prop requires TypeScript - use ESLint rule `@compiled/no-js-xcss` to enforce
7. **CSS extraction side effects**: Must add `"sideEffects": ["**/*.compiled.css"]` to package.json

# Testing Examples Integration

Run specific example apps:

```bash
yarn start:webpack        # Webpack dev server
yarn start:parcel         # Parcel dev server
yarn start:ssr            # SSR example
yarn build:webpack:extract # Test CSS extraction
```

# Reference Files

- Core transformation: `packages/babel-plugin/src/babel-plugin.ts`
- Runtime utilities: `packages/react/src/runtime/`
- All exports: `packages/react/src/index.ts`
- Atomic CSS sorting: `packages/css/src/plugins/sort-atomic-style-sheet.ts`
- Test patterns: `packages/babel-plugin/src/__tests__/index.test.ts`
- ESLint rules: `packages/eslint-plugin/src/rules/`
- Contributing guide: `CONTRIBUTING.md` (includes AST resources)
- Documentation website: `website/` directory

# Additional Resources

- [AST Explorer](https://astexplorer.net) - Visualize Babel AST (use Babel 7 parser)
- [Babel Handbook](https://github.com/jamiebuilds/babel-handbook) - Learn Babel plugin development
- [Documentation website](https://compiledcssinjs.com) - User-facing docs and guides
- Storybook examples: `stories/` directory - Live examples of all features
