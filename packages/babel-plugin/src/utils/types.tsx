import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { Metadata } from '../types';

export interface UnconditionalCssItem {
  type: 'unconditional';
  css: string;
}

export interface LogicalCssItem {
  type: 'logical';
  expression: t.Expression;
  operator: '||' | '??' | '&&';
  css: string;
}

export type CssItem = UnconditionalCssItem | LogicalCssItem;

export interface CSSOutput {
  css: Array<CssItem>;
  variables: {
    name: string;
    expression: t.Expression;
    prefix?: string;
    suffix?: string;
  }[];
}

export interface PartialBindingWithMeta {
  node: t.Node;
  path: NodePath;
  constant: boolean;
  meta: Metadata;
  source: 'import' | 'module';
}
