import type * as t from '@babel/types';
import { JSX_ANNOTATION_REGEX } from '@compiled/utils';

type JsxPragma = {
  name: string;
  comment: t.Comment;
};

/**
 * Get the function name listed in the last JSX pragma found in the file.
 * A JSX pragma is a block comment that looks like this:
 *
 *     /** @ jsx myPragmaFunction * /
 *
 * and is used in conjunction with an import statement like
 *
 *     import { jsx as myPragmaFunction } from '@compiled/react';
 *
 * This function is designed to detect the JSX pragma in the same way
 * as the jsx-pragma rule in @compiled/eslint-plugin.
 *
 * @param comments List of comments in the file
 * @returns The name of the function listed in the JSX pragma, e.g. the `customJsx` in `@ jsx customJsx`
 */
export const getClassicJsxPragma = (
  comments: t.Comment[] | null | undefined
): JsxPragma | undefined => {
  if (!comments) return undefined;
  let jsxPragmaName: JsxPragma | undefined = undefined;

  for (const comment of comments) {
    const match = JSX_ANNOTATION_REGEX.exec(comment.value);
    if (match) {
      // Extract the name of the jsx function mentioned in the jsx pragma
      jsxPragmaName = { name: match[1], comment };
    }
  }

  return jsxPragmaName;
};
