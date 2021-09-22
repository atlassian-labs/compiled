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

# Make sure to always stop the flow background process
trap "flow stop &> /dev/null" EXIT
echo "Validating with flow"
flow
