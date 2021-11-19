import type { Root as ValuesRoot } from 'postcss-values-parser';

export type ConversionFunction = (value: ValuesRoot) => { prop?: string; value: string | number }[];
