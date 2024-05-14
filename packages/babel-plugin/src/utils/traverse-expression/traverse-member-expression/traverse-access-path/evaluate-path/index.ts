import * as t from '@babel/types';

import type { Metadata } from '../../../../../types';
import { createResultPair } from '../../../../create-result-pair';

import { evaluateNamespaceImportPath } from './namespace-import';
import { evaluateObjectPath } from './object';

export const evaluatePath = (
  expression: t.Expression,
  meta: Metadata,
  pathName: string
): ReturnType<typeof createResultPair> => {
  if (t.isObjectExpression(expression)) {
    return evaluateObjectPath(expression, meta, pathName);
  } else if (t.isTSAsExpression(expression)) {
    return evaluatePath(expression.expression, meta, pathName);
  } else if (t.isImportNamespaceSpecifier(expression)) {
    return evaluateNamespaceImportPath(expression, meta.state.file, meta, pathName);
  }

  return createResultPair(expression, meta);
};
