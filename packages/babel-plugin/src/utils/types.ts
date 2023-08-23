import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

import type { Metadata } from '../types';

export interface UnconditionalCssItem {
  type: 'unconditional';
  css: string;
}

export interface ConditionalCssItem {
  type: 'conditional';
  test: t.Expression;
  consequent: CssItem;
  alternate: CssItem;
}

export interface LogicalCssItem {
  type: 'logical';
  expression: t.Expression;
  operator: '||' | '??' | '&&';
  css: string;
}

export interface SheetCssItem {
  type: 'sheet';
  css: string;
}

export interface CssMapItem {
  name: string;
  type: 'map';
  expression: t.Expression;
  // We can remove this once we local transform other CssItem types
  css: string;
}

export type CssItem =
  | UnconditionalCssItem
  | ConditionalCssItem
  | LogicalCssItem
  | SheetCssItem
  | CssMapItem;

export type Variable = {
  name: string;
  expression: t.Expression;
  prefix?: string;
  suffix?: string;
};

export interface CSSOutput {
  css: CssItem[];
  variables: Variable[];
}

export interface PartialBindingWithMeta {
  node: t.Node;
  path: NodePath;
  constant: boolean;
  meta: Metadata;
  source: 'import' | 'module';
}

export type EvaluateExpression = (
  expression: t.Expression,
  meta: Metadata
) => { value: t.Expression; meta: Metadata };
