import { Compiler } from 'webpack';

export default class CompiledExtractPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.beforeCompile.tapAsync('CompiledExtractPlugin', (params, callback): void => {
      console.log(params);

      callback();
    });
  }
}
