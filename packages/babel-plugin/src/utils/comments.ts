import type { BabelFile } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

import type { Metadata } from '../types';

/**
 * Get comments for `path` in both the line before and on the current line.
 *
 * e.g.
 * `<div css={{color: 'green'}} /> // @compiled-disable-line` will output `{before: [], current: [...]}
 *
 * @param path {NodePath<t.Node>}
 * @param meta {Metadata} Context for the transform
 * @returns {before: t.CommentLine[], current: t.CommentLine[]} Comments before and on the current line as the input path
 */
export const getNodeComments = (
  path: NodePath<t.Node>,
  meta: Metadata
): { before: t.CommentLine[]; current: t.CommentLine[] } => {
  const lineNumber = path.node?.loc?.start.line;
  if (!lineNumber || lineNumber !== path.node?.loc?.end.line) {
    return { before: [], current: [] };
  }

  const file: BabelFile = meta.state.file;
  const commentLines =
    file.ast.comments?.filter<t.CommentLine>(
      (comment: t.CommentLine | t.CommentBlock): comment is t.CommentLine =>
        comment.type === 'CommentLine'
    ) ?? [];

  return {
    before: commentLines.filter(
      (comment) =>
        comment.loc?.start.line === lineNumber - 1 && comment.loc.end.line === lineNumber - 1
    ),
    current: commentLines.filter(
      (comment) => comment.loc?.start.line === lineNumber && comment.loc.end.line === lineNumber
    ),
  };
};
