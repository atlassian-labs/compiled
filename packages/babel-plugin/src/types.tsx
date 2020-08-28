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
   * Userland options that can be set to change what happens when the Babel Plugin is ran.
   */
  opts: PluginOptions;
}

export interface Metadata {
  /**
   * State of the current plugin run.
   */
  state: State;

  /**
   * Path of a parent node.
   */
  parentPath: NodePath<any>;
}
