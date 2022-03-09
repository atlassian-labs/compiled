import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

export type Result<T> = {
  node: t.Node;
  path: NodePath<T>;
};
