declare module '@parcel/plugin' {
  interface Asset {
    isSource: boolean;
    filePath: string;
    isASTDirty(): boolean;
    addIncludedFile(file: string): void;
    getCode(): Promise<string>;
    getAST(): Promise<any>;
    setCode(code: string): void;
    setAST(opts: { type: string; version: string; program: any }): void;
  }

  interface ConfigResult<TConfig extends unknown> {
    contents: TConfig;
    filePath: string;
  }

  interface ConfigSetup<TConfig extends unknown> {
    shouldInvalidateOnStartup(): void;
    setResult(opts: TConfig): void;
    getConfig(
      files: string[],
      opts: { packageKey: string }
    ): Promise<ConfigResult<TConfig> | undefined>;
  }

  interface TransformerOpts<TConfig extends unknown> {
    canReuseAST(opts: { asset: Asset; config: TConfig }): boolean;
    parse(opts: { asset: Asset; config: TConfig }): Promise<any>;
    transform(opts: { asset: Asset; config: TConfig }): Promise<any[]>;
    generate(opts: { asset: Asset; ast: any }): { content: string; map: any };
    loadConfig(opts: { config: ConfigSetup<TConfig> }): Promise<void>;
  }

  export class Transformer<TConfig extends unknown> {
    constructor(opts: TransformerOpts<TConfig>);
  }
}
