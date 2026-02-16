#!/usr/bin/env node
/**
 * Post-processes emitted ESM .js files to add .js to relative import/export
 * specifiers. Node's ESM loader requires explicit extensions; tsc does not add
 * them. This keeps source as natural `from './utils'` and fixes emitted output.
 *
 * Run after build:esm (e.g. from postbuild). Only touches .js under dist/esm in each package.
 */

const fs = require('fs');
const path = require('path');

const PACKAGES_DIR = path.join(__dirname, '..', 'packages');
const ESM_DIR = 'dist/esm';
const HAS_EXTENSION = /\.(js|mjs|cjs|json)$/;

// Match static import/export: from './path' or from "../path"
function addJsToRelativeSpecifiers(content) {
  return content.replace(/(\bfrom\s+['"])(\.\.?\/[^'"]+)(['"])/g, (_, before, spec, after) => {
    if (HAS_EXTENSION.test(spec)) return before + spec + after;
    return before + spec + '.js' + after;
  });
}

function* walkJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walkJsFiles(full);
    } else if (e.isFile() && e.name.endsWith('.js')) {
      yield full;
    }
  }
}

function main() {
  const packagesDir = path.resolve(PACKAGES_DIR);
  if (!fs.existsSync(packagesDir)) {
    console.warn('add-esm-js-extensions: packages dir not found, skipping');
    return;
  }

  const packageNames = fs.readdirSync(packagesDir);
  let filesUpdated = 0;

  for (const name of packageNames) {
    const esmDir = path.join(packagesDir, name, ESM_DIR);
    if (!fs.existsSync(esmDir) || !fs.statSync(esmDir).isDirectory()) continue;

    for (const file of walkJsFiles(esmDir)) {
      const content = fs.readFileSync(file, 'utf8');
      const updated = addJsToRelativeSpecifiers(content);
      if (updated !== content) {
        fs.writeFileSync(file, updated);
        filesUpdated += 1;
      }
    }
  }

  if (filesUpdated > 0) {
    console.log(`add-esm-js-extensions: updated ${filesUpdated} file(s)`);
  }
}

main();
