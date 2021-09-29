/**
 * Minimal typing inferred from https://github.com/parcel-bundler/parcel/blob/v2.0.0-rc.0/flow-libs/json-source-map.js.flow
 */

declare module 'json-source-map' {
  interface Position {
    line: number;
    column: number;
    pos: number;
  }

  interface Mapping {
    value: Position;
    valueEnd: Position;
    key?: Position;
    keyEnd?: Position;
  }
}
