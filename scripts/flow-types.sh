#!/usr/bin/env bash
PACKAGES=({packages/react,packages/jest})

generate() {
  echo "Generating flow types with flowgen"
  find "${PACKAGES[@]}" -type f -path '*/dist/*' -name '*.d.ts' \
    -not -path '*/cjs/*' \
    -not -path '*/browser/*' \
    -not -path '*/__tests__/*' \
    -not -path '*/__perf__/*' \
    -not -path '*/__fixtures__/*' \
    -not -path 'packages/react/*/index.*' \
    -not -path 'packages/react/*/jsx/jsx-local-namespace.*' \
    -not -path 'packages/react/*/jsx/jsx-runtime.*' \
    -not -path 'packages/react/*/jsx/jsx-dev-runtime.*' \
    -print0 | while read -rd $'\0' file; do
    flowFilename=${file%.*.*}.js.flow
    flowgen --add-flow-header "$file" -o "$flowFilename"
    if [ ! -f "$flowFilename" ]; then
      echo "Type '$flowFilename' was not generated"
      exit 1
    fi

    # Copy to type directory
    newFile=$(echo "$flowFilename" | sed -E 's/dist\/(esm\/)?/src\//g')
    mkdir -p "$(dirname "$newFile")"
    mv "$flowFilename" "$newFile"
  done

  echo "Patching types"
  find "${PACKAGES[@]}" -type f -path '*/src/*' -name '*.js.flow' \
    -not -path '*/__tests__/*' \
    -not -path '*/__perf__/*' \
    -not -path '*/__fixtures__/*' \
    -not -path '*/node_modules/*' \
    -not -path 'packages/react/*/index.*' \
    -not -path 'packages/react/*/jsx/jsx-local-namespace.*' \
    -not -path 'packages/react/*/jsx/jsx-runtime.*' \
    -not -path 'packages/react/*/jsx/jsx-dev-runtime.*' \
    -print0 | while read -rd $'\0' file; do

    # Change import to import type (bug in flowgen)
    sed -i.bak -E 's/import {/import type {/g' "$file" && rm "$file.bak"

    # Define TemplateStringsArray type
    sed -i.bak -E 's/TemplateStringsArray/$ReadOnlyArray<string>/g' "$file" && rm "$file.bak"

    # Use readonly array to handle flow strict mode
    sed -i.bak -E 's/css: CssObject<TProps> \| CssObject<TProps>\[\],/css: CssObject<TProps> \| \$ReadOnlyArray<CssObject<TProps>>,/g' "$file" && rm "$file.bak"

    # Rename JSX.IntrinsicElements to existing flow type
    sed -i.bak -E 's/JSX.IntrinsicElements/$JSXIntrinsics/g' "$file" && rm "$file.bak"

    # Rename $ElementType<$JSXIntrinsics, TTag> to exact flow typs
    sed -i.bak -E 's/\$ElementType<\$JSXIntrinsics, TTag>/$Exact<$ElementType<$JSXIntrinsics, TTag>>/g' "$file" && rm "$file.bak"

    # Rename jest.CustomMatcherResult type to existing flow type
    sed -i.bak -E 's/jest.CustomMatcherResult/JestMatcherResult/g' "$file" && rm "$file.bak"

    # Refactor interface to object type to allow spreading
    sed -i.bak -E 's/export interface StyledProps \{/export type StyledProps = \{/g' "$file" && rm "$file.bak"

    # Refactor to flow style handling of default generic types
    awk -v RS='' '{gsub(/CssFunction[^\S|]*\|[^\S|]*CssFunction\[\]/, "CssFunction<> | CssFunction<>[]"); print}' "$file" >"$file.tmp" &&
      mv "$file.tmp" "$file"
  done

  echo "Running Prettier"
  for package in "${PACKAGES[@]}"; do
    npx pretty-quick
  done
}

validate() {
  # Make sure to always stop the flow background process
  trap "flow stop &> /dev/null" EXIT
  echo "Validating with flow"
  flow
}

compare() {
  # Run generate pipeline
  generate

  # Check if working copy has any changes in flow types
  for package in "${PACKAGES[@]}"; do
    git add "$package"
  done

  changed_types=$(git diff --name-only HEAD | grep .js.flow)
  if [ -n "$changed_types" ]; then
    echo
    echo "Out of sync flow types have been detected. Make sure to run 'yarn flow-types generate' and commit changes."
    echo "Any bugs in these types should be resolved by updating the 'generate' function in 'scripts/flow-types.sh'"
    echo
    echo "The following flow types are out of sync:"
    echo "$changed_types"
    git diff HEAD
    exit 1
  else
    echo "Flow types are in sync"
  fi
}

build() {
  echo "Copying flow types to dist"
  find "${PACKAGES[@]}" -type f -path '*/src/*' -name '*.js.flow' -not -path '*/node_modules/*' -not -path '*/__tests__/*' -print0 | while read -rd $'\0' file; do
    esmDirname=$(dirname "$file" | sed 's/\/src/\/dist\/esm/g')
    if [ -d "$esmDirname" ]; then
      cp "$file" "$(echo "$file" | sed -E 's/src\//dist\/esm\//g')"
      cp "$file" "$(echo "$file" | sed -E 's/src\//dist\/cjs\//g')"
      cp "$file" "$(echo "$file" | sed -E 's/src\//dist\/browser\//g')"
    else
      cp "$file" "$(echo "$file" | sed -E 's/src\//dist\//g')"
    fi
  done
}

if [ "$1" == "generate" ]; then
  generate
elif [ "$1" == "validate" ]; then
  validate
elif [ "$1" == "compare" ]; then
  compare
elif [ "$1" == "build" ]; then
  build
else
  echo "usage: $0 <generate|validate|compare|build>"
  exit 1
fi
