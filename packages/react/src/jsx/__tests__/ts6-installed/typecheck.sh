#!/usr/bin/env bash
set -e
# Requires dist/ to be built first (via `yarn build:esm` at the workspace root).
test -f dist/esm/jsx/jsx-local-namespace.d.ts || { echo "Error: dist/esm/jsx/jsx-local-namespace.d.ts not found. Run 'yarn build:esm' first."; exit 1; }
# Copy the freshly built .d.ts into the local node_modules.
cp dist/esm/jsx/jsx-local-namespace.d.ts src/jsx/__tests__/ts6-installed/node_modules/@compiled/react/dist/esm/jsx/
node ../../node_modules/typescript6/bin/tsc --noEmit --project src/jsx/__tests__/ts6-installed/tsconfig.json
