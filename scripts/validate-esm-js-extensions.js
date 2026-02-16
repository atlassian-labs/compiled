#!/usr/bin/env node
/**
 * Validates that ESM .js files under packages/<pkg>/dist/esm use .js (or .mjs/.cjs/.json)
 * on all relative import/export specifiers. Node's ESM loader requires explicit
 * extensions. Run after build:esm (e.g. in CI or as part of build). Exits 1 if
 * any relative specifier is missing an extension.
 */

const fs = require('fs');
const path = require('path');

const PACKAGES_DIR = path.join(__dirname, '..', 'packages');
const ESM_DIR = 'dist/esm';
const HAS_EXTENSION = /\.(js|mjs|cjs|json)$/;

// Match static import/export: from './path' or from "../path" or export ... from './path'
const RELATIVE_SPECIFIER = /\b(?:from|import)\s+['"](\.\.?\/[^'"]+)['"]/g;

function* walkJsFiles(dir) {
  if (!fs.existsSync(dir)) return;
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

// Strip comments so example code in JSDoc doesn't trigger false positives.
function stripComments(line) {
  return line
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .trim();
}

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const violations = [];
  let match;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    // Skip JSDoc/block comment continuation lines (e.g. " * import ...")
    if (/^\s*\*/.test(raw)) continue;
    const lineWithoutComments = stripComments(raw);
    if (!lineWithoutComments) continue;
    RELATIVE_SPECIFIER.lastIndex = 0;
    while ((match = RELATIVE_SPECIFIER.exec(lineWithoutComments)) !== null) {
      const spec = match[1];
      if (!HAS_EXTENSION.test(spec)) {
        violations.push({ line: i + 1, specifier: spec });
      }
    }
  }
  return violations;
}

function main() {
  const packagesDir = path.resolve(PACKAGES_DIR);
  if (!fs.existsSync(packagesDir)) {
    console.warn('validate-esm-js-extensions: packages dir not found, skipping');
    return 0;
  }

  const packageNames = fs.readdirSync(packagesDir);
  let failed = 0;

  for (const name of packageNames) {
    const esmDir = path.join(packagesDir, name, ESM_DIR);
    if (!fs.existsSync(esmDir) || !fs.statSync(esmDir).isDirectory()) continue;

    for (const file of walkJsFiles(esmDir)) {
      const violations = validateFile(file);
      if (violations.length > 0) {
        failed += violations.length;
        const relativePath = path.relative(packagesDir, file);
        for (const v of violations) {
          console.error(
            `${relativePath}:${v.line}: relative specifier missing extension: "${v.specifier}"`
          );
        }
      }
    }
  }

  if (failed > 0) {
    console.error(
      `\nvalidate-esm-js-extensions: ${failed} relative import(s)/export(s) missing .js (or .mjs/.cjs/.json).`
    );
    console.error('Add .js to relative specifiers in source so emitted ESM is valid for Node.');
    process.exit(1);
  }
}

main();
