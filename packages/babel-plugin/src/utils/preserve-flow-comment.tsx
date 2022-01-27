import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

/**
 * Ensure that any @flow comment is preserved at the top of the processed file before any additional imports are 
 * dynamically inserted during the build. 
 *
 * @param path
 */
 export const preserveFlowComment = (path: NodePath<t.Program>): void => {

    const leadingComment = path.node.body.length > 0 &&
    path.node.body[0].leadingComments &&
    path.node.body[0].leadingComments.length > 0 &&
    path.node.body[0].leadingComments[0];

    if(leadingComment && leadingComment.value.indexOf('@flow') !== -1) {
        path.addComment('leading', leadingComment.value);
    }
}

