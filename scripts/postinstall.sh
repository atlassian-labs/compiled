#!/usr/bin/env bash

set -Eeuo pipefail

trap cleanup SIGINT SIGTERM ERR EXIT

cleanup() {
  trap - SIGINT SIGTERM ERR EXIT

  rm -f yarn.lock.bak
}

# Remove any atlassian mirrors
sed -i.bak -E 's/https:\/\/packages.atlassian.com\/api\/npm\/npm-remote\//https:\/\/registry.yarnpkg.com\//g' yarn.lock

# Deduplicate
npx yarn-deduplicate

# Run yarn again to transform any changes
yarn --ignore-scripts
