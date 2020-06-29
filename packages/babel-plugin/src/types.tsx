import * as t from '@babel/types';

export interface PluginOptions {
  nonce?: string;
}

export interface State {
  compiledImportFound: boolean;
  declarations?: { [name: string]: t.VariableDeclaration | t.FunctionDeclaration };
  opts: PluginOptions;
}
