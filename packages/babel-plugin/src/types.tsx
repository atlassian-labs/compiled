import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import { PluginPass } from '@babel/core';
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

  /**
   * Will import the React namespace if it is missing.
   * When using the `'automatic'` jsx runtime set this to `false`.
   *
   * Defaults to `true`.
   */
  importReact?: boolean;
}

export interface State extends PluginPass {
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
    ClassNames?: string;
    Global?: string;
  };

  /**
   * Userland options that can be set to change what happens when the Babel Plugin is ran.
   */
  opts: PluginOptions;

  /**
   * Data of the current file being transformed.
   */
  file: any;

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
  /**
   * Name of the component.
   * Could be inbuilt "div" or user defined "MyComponent".
   */
  name: string;

  /**
   * Type of the component - inbuilt e.g. "div" or user defined e.g. "MyComponent".
   */
  type: 'InBuiltComponent' | 'UserDefinedComponent';
}
