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
