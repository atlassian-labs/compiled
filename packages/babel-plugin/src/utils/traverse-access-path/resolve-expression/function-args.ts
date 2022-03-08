import traverse from '@babel/traverse';
import * as t from '@babel/types';

/*
 * Finds a call expression within a member given the function name
 * TODO:FIX - This won't work if the member contains more than
 * one of the same function name i.e. `obj.getValue().getValue()`
 */
export const getFunctionArgs = (
  functionName: string,
  memberExpression: t.MemberExpression
): t.CallExpression['arguments'] => {
  const identifierOpts = { name: functionName };
  let args: t.CallExpression['arguments'] = [];

  traverse(memberExpression, {
    noScope: true,
    CallExpression(path) {
      const { node } = path;
      const { callee } = node;
      const found =
        t.isIdentifier(callee, identifierOpts) ||
        (t.isMemberExpression(callee) && t.isIdentifier(callee.property, identifierOpts));

      if (found) {
        args = node.arguments;
        path.stop();
      }
    },
  });

  return args;
};
