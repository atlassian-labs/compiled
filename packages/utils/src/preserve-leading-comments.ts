import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

/**
 * Ensure that any leading comment is preserved at the top of the processed file before additional imports are
 * dynamically inserted during the build.
 *
 * @param path
 */
export const preserveLeadingComments = (path: NodePath<t.Program>): void => {
  const leadingComments = path.node.body?.[0]?.leadingComments;

  if (leadingComments) {
    path.addComments('leading', leadingComments as any);

    path.node.body[0].leadingComments = null;
  }
};
