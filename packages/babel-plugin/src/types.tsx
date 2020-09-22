import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';

import { Cache } from './utils/cache';

export interface PluginOptions {
  /**
   * Security nonce that will be applied to inline style elements if defined.
   */
  nonce?: string;
  /**
   * Whether to use the cache or not. Will make subsequent builds faster.
   */
  cache?: boolean;
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

  /**
   * Holds a record of currently hoisted sheets in the module.
   */
  sheets: Record<string, t.Identifier>;

  /**
   * For storing cache of any type. For eg. caching deep traversed path value.
   */
  cache: InstanceType<typeof Cache>;
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

export interface Tag {
  name: string;
  type: 'InBuiltComponent' | 'UserDefinedComponent';
}
