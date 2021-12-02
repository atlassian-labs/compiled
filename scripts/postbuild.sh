#!/usr/bin/env bash

# This script deletes artifacts inside /dist/ folders that shouldn't be there.

find ./packages/**/dist/** -name "__tests__" -not -path "*/node_modules/*" -type d -exec rm -rf {} +
find ./packages/**/dist/** -name "__perf__" -not -path "*/node_modules/*" -type d -exec rm -rf {} +
