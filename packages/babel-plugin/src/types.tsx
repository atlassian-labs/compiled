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
   * If the module is found, the object will be defined.
   * If a particular API is found, the name of the import will be the value.
   *
   * E.g:
   *
   * ```
   * {
   *   styled: 'styledFunction'
   * }
   * ```
   *
   * Means the `styled` api was found as `styledFunction` - as well as CSS prop is enabled in this module.
   */
  compiledImports?: {
    styled?: string;
  };

  /**
   * Current working directory.
   */
  cwd: string;

  /**
   * Data of the current file being transformed.
   */
  file: any;

  /**
   * Optional filename.
   */
  filename: string | undefined;

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
