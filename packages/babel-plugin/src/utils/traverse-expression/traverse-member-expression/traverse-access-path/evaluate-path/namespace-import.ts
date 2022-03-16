import * as t from '@babel/types';

import type { Metadata } from '../../../../../types';
import { createResultPair } from '../../../../create-result-pair';
import { getDefaultExport, getNamedExport } from '../../../../traversers';

export const evaluateNamespaceImportPath = (
  expression: t.Expression,
  file: t.File,
  meta: Metadata,
  exportName: string
): ReturnType<typeof createResultPair> => {
  const result =
    exportName === 'default' ? getDefaultExport(file) : getNamedExport(file, exportName);

  if (result) {
    const { node, path } = result;
    const updatedMeta = { ...meta, parentPath: path, ownPath: meta.parentPath };
    const { parentPath } = updatedMeta;

    if (exportName === 'default' && !parentPath.scope.getOwnBinding('default')) {
      parentPath.scope.push({
        id: t.identifier('default'),
        init: node as t.Expression,
        kind: 'const',
      });
    }

    return createResultPair(node as t.Expression, updatedMeta);
  }

  return createResultPair(expression, meta);
};
