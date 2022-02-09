// Derived from the README and source of json-source-map located at
// https://github.com/epoberezkin/json-source-map and
// https://github.com/epoberezkin/json-source-map/blob/v0.6.1/index.js
// Which is licensed MIT

declare module 'json-source-map' {
  export interface ParseOptions {
    bigint?: boolean;
  }

  export type PointerProp = 'value' | 'valueEnd' | 'key' | 'keyEnd';

  export interface Location {
    line: number;
    column: number;
    pos: number;
  }

  export type Mapping = Record<PointerProp, Location>;

  export type Pointers = Record<string, Mapping>;

  export interface ParseResult {
    data: any;
    pointers: Pointers;
  }

  export function parse(source: string, _reviver?: any, options?: ParseOptions): ParseResult;

  export interface StringifyOptions {
    space?: string | number;
    es6?: boolean;
  }

  export interface StringifyResult {
    json: string;
    pointers: Pointers;
  }

  export function stringify(
    data: any,
    _replacer?: any,
    options?: string | number | StringifyOptions
  ): StringifyResult;
}
