declare module '@parcel/plugin' {
  interface Asset {
    isSource: boolean;
    filePath: string;
    isASTDirty(): boolean;
    addIncludedFile(file: string): void;
    getCode(): Promise<string>;
    setAST(opts: { type: string; version: string; program: any }): void;
  }

  interface TransformerOpts {
    canReuseAST(opts: { asset: Asset; config: any }): boolean;
    parse(opts: { asset: Asset; config: any }): Promise<any>;
    transform(opts: { asset: Asset; ast: any; config: any }): Promise<any[]>;
    generate(opts: { asset: Asset; ast: any }): { content: string; map: any };
  }

  export class Transformer {
    constructor(opts: TransformerOpts);
  }
}
