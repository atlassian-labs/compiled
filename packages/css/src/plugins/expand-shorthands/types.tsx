import { Declaration } from 'postcss';
import { Root as ValuesRoot } from 'postcss-values-parser';

export type ConversionFunction = (node: Declaration, value: ValuesRoot) => Declaration[];
