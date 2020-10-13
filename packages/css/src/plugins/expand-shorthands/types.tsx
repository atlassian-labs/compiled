import { Root as ValuesRoot } from 'postcss-values-parser';

export type ConversionFunction = (
  value: ValuesRoot
) => Array<{ prop?: string; value: string | number }>;
