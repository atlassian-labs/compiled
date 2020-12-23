import * as t from '@babel/types';

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
