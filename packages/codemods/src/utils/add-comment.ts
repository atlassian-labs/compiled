import type { Collection, JSCodeshift, Program } from 'jscodeshift';

import { COMPILED_IMPORT_PATH } from '../constants';

// not replacing newlines (which \s does)
const spacesAndTabs = /[ \t]{2,}/g;
const lineStartWithSpaces = /^[ \t]*/gm;

const clean = (value: string) =>
  value
    .replace(spacesAndTabs, ' ')
    .replace(lineStartWithSpaces, '')
    // using .trim() to clear the any newlines before the first text and after last text
    .trim();

export const addCommentBefore = ({
  j,
  collection,
  message,
}: {
  j: JSCodeshift;
  collection: Collection<Program>;
  message: string;
}): void => {
  const content = ` TODO(${COMPILED_IMPORT_PATH} codemod): ${clean(message)} `;
  collection.forEach((path) => {
    path.value.comments = path.value.comments || [];

    const exists = path.value.comments.find((comment) => comment.value === content);

    // avoiding duplicates of the same comment
    if (exists) {
      return;
    }

    path.value.comments.push(j.commentBlock(content));
  });
};
