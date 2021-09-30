#!/usr/bin/env bash
PACKAGES=({packages/react,packages/jest})

echo "Cleaning existing flow types from dist"
find packages -type f -path '*/dist/*' -name '*.js.flow' -delete

echo "Copying type overrides"
find "${PACKAGES[@]}" -path '*/src/*' -name '*.js.flow' -not -path '*/node_modules/*' -not -path '*/__tests__/*' -print0 | while read -rd $'\0' override; do
  echo "Found type override '$override'"
  esmDirname=$(dirname "$override" | sed 's/\/src/\/dist\/esm/g')
  if [ -d "${esmDirname%.*.*}" ]; then
    cp "$override" "$(echo "$override" | sed 's/\/src/\/dist\/browser/g')"
    cp "$override" "$(echo "$override" | sed 's/\/src/\/dist\/cjs/g')"
    cp "$override" "$(echo "$override" | sed 's/\/src/\/dist\/esm/g')"
  else
    cp "$override" "$(echo "$override" | sed 's/\/src/\/dist/g')"
  fi
done

echo "Generating remaining flow types with flowgen"
find "${PACKAGES[@]}" -type f -path '*/dist/*' -name '*.d.ts' -print0 | while read -rd $'\0' file; do
  if [ -f "${file%.*.*}.js.flow" ]; then
    continue
  fi

  flowgen --add-flow-header "$file" -o "${file%.*.*}.js.flow"
  if [ ! -f "${file%.*.*}.js.flow" ]; then
    echo "Type '${file%.*.*}.js.flow' was not generated"
    exit 1
  fi
done

echo "Patching types"
find "${PACKAGES[@]}" -type f -path '*/dist/*' -name '*.js.flow' -print0 | while read -rd $'\0' file; do
  # Change import to import type (bug in flowgen)
  sed -i '' 's/import {/import type {/g' "$file"

  # Define TemplateStringsArray type
  sed -i '' 's/TemplateStringsArray/$ReadOnlyArray<string>/g' "$file"

  # Rename JSX.IntrinsicElements to existing flow type
  sed -i '' 's/JSX.IntrinsicElements/$JSXIntrinsics/g' "$file"

  # Rename jest.CustomMatcherResult type to existing flow type
  sed -i '' 's/jest.CustomMatcherResult/JestMatcherResult/g' "$file"

  # Refactor interface to object type to allow spreading
  sed -i '' 's/export interface StyledProps {/export type StyledProps = {/g' "$file"

  # Refactor to flow style handling of default generic types
  awk -v RS='' '{gsub(/CssFunction[^\S|]*\|[^\S|]*CssFunction\[\]/, "CssFunction<> | CssFunction<>[]"); print}' "$file" >"$file.tmp" &&
    mv "$file.tmp" "$file"
done

echo "Running Prettier"
for package in "${PACKAGES[@]}"; do
  npx prettier --write "$package/dist/**/*.js.flow"
done

# Make sure to always stop the flow background process
trap "flow stop &> /dev/null" EXIT
echo "Validating with flow"
flow
