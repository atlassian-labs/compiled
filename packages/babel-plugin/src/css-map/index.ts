import path from 'path';

import type { NodePath, PluginPass } from '@babel/core';
import * as t from '@babel/types';
import { hash } from '@compiled/utils';

import type { Metadata } from '../types';
import { buildCodeFrameError } from '../utils/ast';
import { buildCss } from '../utils/css-builders';
import { ErrorMessages, createErrorMessage, errorIfNotValidObjectProperty } from '../utils/css-map';
import { transformCssItems } from '../utils/transform-css-items';

import { mergeExtendedSelectorsIntoProperties } from './process-selectors';

/** Must match the prefix used in `transform.ts` from `@compiled/css`. */
const NON_ATOMIC_CLASS_PREFIX = 'cc-';

/**
 * Derives a stable, deterministic non-atomic class name for a `cssMapScoped` variant.
 *
 * Uses a 3-part hash: `hash(relativeFilename + ':' + variableName + ':' + variantKey)`
 * — mirroring the approach used by CSS Modules and Vanilla Extract:
 *
 * - `relativeFilename` — relative path from the Babel project root to the file.
 *   Using a relative path (not absolute) ensures the hash is stable across all machines
 *   and CI environments, regardless of where the monorepo is checked out.
 *   Falls back to `path.basename(filename)` if the file is outside the project root
 *   (e.g. test fixtures at arbitrary absolute paths).
 * - `variableName` — which `cssMapScoped` call (unique per file by JS/TS rules)
 * - `variantKey` — which variant within that call
 *
 * This ensures:
 * - Two `cssMapScoped` calls in the same file with the same variant key → different classes ✅
 * - Two files with the same basename but different paths → different classes ✅
 * - Same file + same variable + same key → same class (correct — it IS the same variant) ✅
 * - Class names are identical on CI and local (relative path, not absolute) ✅
 *
 * Returns `undefined` if the variant key cannot be statically determined.
 */
const getNonAtomicClassName = (
  property: t.ObjectProperty,
  variableName: string,
  state: PluginPass
): string | undefined => {
  const variantKey = t.isIdentifier(property.key)
    ? property.key.name
    : t.isStringLiteral(property.key)
    ? property.key.value
    : undefined;

  if (variantKey === undefined) return undefined;

  // Compute a project-root-relative path so the hash is stable across machines and CI.
  // `state.file.opts.root` is the Babel-configured project root (same on all machines).
  // If the filename is outside the project root (e.g. test fixtures), fall back to basename.
  const filename = state.filename;
  let fileKey: string;
  if (filename) {
    const root = state.file.opts.root ?? process.cwd();
    const rel = path.relative(root, filename);
    fileKey = rel.startsWith('..') ? path.basename(filename) : rel;
  } else {
    fileKey = '';
  }

  return `${NON_ATOMIC_CLASS_PREFIX}${hash(`${fileKey}:${variableName}:${variantKey}`)}`;
};

/**
 * Takes a `cssMap` or `cssMapScoped` function expression and transforms it to a record of
 * class names and sheets.
 *
 * For `cssMap` (atomic output):
 * ```
 * const styles = cssMap({
 *    none: { color: 'red' },
 *    solid: { color: 'green' },
 * });
 * // → const styles = { none: "_syaz5scu", solid: "_syazbf54" };
 * ```
 *
 * For `cssMapScoped` (non-atomic output):
 * ```
 * // @ts-expect-error -- cssMapScoped is not in public @compiled/react types
 * import { cssMapScoped } from '@compiled/react';
 * const styles = cssMapScoped({
 *    panel: { '.panel': { color: 'blue' } },
 *    danger: { '.panel': { color: 'red' } },
 * });
 * // → const styles = { panel: "cc-abc123", danger: "cc-def456" };
 * ```
 *
 * @param path {NodePath} The path to be evaluated.
 * @param meta {Metadata} Useful metadata that can be used during the transformation.
 * @param isCssMapScoped {boolean} Whether this call is `cssMapScoped` (always non-atomic).
 */
export const visitCssMapPath = (
  path: NodePath<t.CallExpression> | NodePath<t.TaggedTemplateExpression>,
  meta: Metadata,
  isCssMapScoped = false
): void => {
  const fnName = isCssMapScoped ? 'cssMapScoped' : 'cssMap';

  // We don't support tagged template expressions.
  if (t.isTaggedTemplateExpression(path.node)) {
    throw buildCodeFrameError(
      createErrorMessage(`${fnName} ${ErrorMessages.NO_TAGGED_TEMPLATE}`),
      path.node,
      meta.parentPath
    );
  }

  // CSS Map must be declared at the top-most scope of the module.
  if (!t.isVariableDeclarator(path.parent) || !t.isIdentifier(path.parent.id)) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.DEFINE_MAP),
      path.node,
      meta.parentPath
    );
  }

  // Both cssMap and cssMapScoped accept exactly one argument (the styles object).
  if (path.node.arguments.length !== 1) {
    throw buildCodeFrameError(
      createErrorMessage(`${fnName} ${ErrorMessages.NUMBER_OF_ARGUMENT}`),
      path.node,
      meta.parentPath
    );
  }

  // The argument must be an object expression.
  if (!t.isObjectExpression(path.node.arguments[0])) {
    throw buildCodeFrameError(
      createErrorMessage(`${fnName} ${ErrorMessages.ARGUMENT_TYPE}`),
      path.node,
      meta.parentPath
    );
  }

  const totalSheets: string[] = [];
  path.replaceWith(
    t.objectExpression(
      path.node.arguments[0].properties.map((property) => {
        errorIfNotValidObjectProperty(property, meta);

        if (!t.isObjectExpression(property.value)) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.STATIC_VARIANT_OBJECT),
            property.value,
            meta.parentPath
          );
        }

        const processedPropertyValue = mergeExtendedSelectorsIntoProperties(property.value, meta);
        const { css, variables } = buildCss(processedPropertyValue, meta);

        if (variables.length) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.STATIC_VARIANT_OBJECT),
            property.value,
            meta.parentPath
          );
        }

        const nonAtomicClassName = isCssMapScoped
          ? getNonAtomicClassName(
              property as t.ObjectProperty,
              // path.parent is already validated as VariableDeclarator with Identifier id (line ~81)
              (path.parent as t.VariableDeclarator & { id: t.Identifier }).id.name,
              meta.state
            )
          : undefined;

        const { sheets, classNames } = transformCssItems(css, meta, {
          nonAtomic: isCssMapScoped,
          nonAtomicClassName,
        });
        totalSheets.push(...sheets);

        if (classNames.length > 1) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.STATIC_VARIANT_OBJECT),
            property,
            meta.parentPath
          );
        }

        return t.objectProperty(property.key, classNames[0] || t.stringLiteral(''));
      })
    )
  );

  // Store sheets in meta state so we can use them later to generate the Compiled component.
  meta.state.cssMap[path.parent.id.name] = totalSheets;
};
