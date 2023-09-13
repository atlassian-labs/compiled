import type { NodePath } from '@babel/core';
import * as t from '@babel/types';

import type { Metadata } from '../types';
import { buildCodeFrameError } from '../utils/ast';
import { compiledTemplate } from '../utils/build-compiled-component';

// The messages are exported for testing.
export enum ErrorMessages {
  MIXED_CSS_AND_XCSS = 'Cannot use both xcss and css props on the same element.',
  XCSS_NOT_FOUND = 'No correspoding sheets found for xcss prop.',
}

/**
 * Takes a JSX opening element and then transforms any usage of `xcss` prop to a compiled component.
 *
 * `<div xcss={styleOverrides}>`
 *
 * @param path {NodePath} The opening JSX element
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const visitXCssPropPath = (path: NodePath<t.JSXOpeningElement>, meta: Metadata): void => {
  if (Object.keys(meta.state.xcss).length === 0) {
    // Return early if no xcss is found.
    return;
  }

  let hasXcssProp = false;
  let hasCssProp = false;
  let hasXcssParsedProp = false;

  path.get('attributes').forEach((attr): void => {
    if (t.isJSXAttribute(attr.node) && attr.node.name.name === 'xcss') {
      hasXcssProp = true;
    }

    if (t.isJSXAttribute(attr.node) && attr.node.name.name === 'css') {
      hasCssProp = true;
    }

    if (t.isJSXAttribute(attr.node) && attr.node.name.name === 'xcssParsed') {
      hasXcssParsedProp = true;
    }
  });

  if (!hasXcssProp) {
    // Return if no xcss prop
    return;
  }

  if (hasXcssParsedProp) {
    // Return if the path has been evaluated
    return;
  }

  if (hasCssProp) {
    throw buildCodeFrameError(ErrorMessages.MIXED_CSS_AND_XCSS, path.node, meta.parentPath);
  }

  const sheets: string[] = [];

  // Gather sheets
  path.traverse({
    Identifier(path) {
      if (meta.state.xcss[path.node.name]) {
        sheets.push(...meta.state.xcss[path.node.name]);
      }
    },
  });

  // Add 'xcssParsed' prop to element.
  // Mark element as evaluated to avoid infinite loop
  path.node.attributes.push(t.jsxAttribute(t.jsxIdentifier('xcssParsed')));

  // Remove 'xcssParsed' prop from element when exiting.
  path.traverse({
    JSXAttribute(path) {
      if (path.node.name.name === 'xcssParsed') {
        meta.state.pathsToCleanup.push({
          action: 'remove',
          path,
        });
      }
    },
  });

  if (sheets.length === 0) {
    throw buildCodeFrameError(ErrorMessages.XCSS_NOT_FOUND, path.node, meta.parentPath);
  }

  path.parentPath.replaceWith(compiledTemplate(path.parentPath.node as t.JSXElement, sheets, meta));
};
