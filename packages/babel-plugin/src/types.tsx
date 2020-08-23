import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';

export interface PluginOptions {
  /**
   * Security nonce that will be applied to inline style elements if defined.
   */
  nonce?: string;
}

export interface State {
  /**
   * Boolean turned true if the compiled module import is found.
   */
  compiledImportFound: boolean;

  /**
   * Declarations that are stored to be accessed later.
   * Can be both variable and functions.
   */
  declarations?: { [name: string]: t.VariableDeclaration | t.FunctionDeclaration };

  /**
   * Userland options that can be set to change what happens when the Babel Plugin is ran.
   */
  opts: PluginOptions;
}

export interface Metadata {
  state: State;
  parentPath: NodePath<any>;
}
