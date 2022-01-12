import type { PluginPass } from '@babel/core';
import type { ParserPlugin } from '@babel/parser';
import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

import type { Cache } from './utils/cache';

export interface Resolver {
  resolveSync(context: string, request: string): string;
}

export interface PluginOptions {
  /**
   * Whether to use the cache or not. Will make subsequent builds faster.
   *
   * - `true` caches for the duration of the node run (useful for single builds)
   * - `"file-pass"` caches per file pass (useful for watch mode)
   * - `false` turns caching off
   */
  cache?: boolean | 'file-pass';

  /**
   * Will import the React namespace if it is missing.
   * When using the `'automatic'` jsx runtime set this to `false`.
   *
   * Defaults to `true`.
   */
  importReact?: boolean;

  /**
   * Security nonce that will be applied to inline style elements if defined.
   */
  nonce?: string;

  /**
   * Callback fired at the end of the file pass when files have been included in the transformation.
   */
  onIncludedFiles?: (files: string[]) => void;

  /**
   * A custom resolver used to statically evaluate import declarations
   */
  resolver?: Resolver;

  /**
   * List of file extensions to traverse as code
   */
  extensions?: string[];

  /**
   * List of babel plugins to be applied to evaluated files
   */
  babelPlugins?: ParserPlugin[];
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
    ClassNames?: string;
    css?: string;
    keyframes?: string;
    styled?: string;
  };

  /**
   * Details of pragmas that are currently enabled in the pass.
   */
  pragma: {
    jsx?: boolean;
    jsxImportSource?: boolean;
  };

  /**
   * Paths that will be cleaned up on pass exit.
   */
  pathsToCleanup: { action: 'replace' | 'remove'; path: NodePath }[];

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
  cache: Cache;

  /**
   * Files that have been included in this pass.
   */
  includedFiles: string[];
}

interface CommonMetadata {
  /**
   * State of the current plugin run.
   */
  state: State;

  /**
   * Path of a parent node.
   */
  parentPath: NodePath<any>;

  /**
   * We used this to store path of the IIFE node we created around the calling
   * function. We created an IIFE to resolve the parameters to the args in isolation
   * (using isolated scope created around IIFE).
   */
  ownPath?: NodePath<any>;
}

interface KeyframesMetadata extends CommonMetadata {
  context: 'keyframes';
  keyframe: string;
}

interface RootMetadata extends CommonMetadata {
  context: 'root';
}

export type Metadata = RootMetadata | KeyframesMetadata;

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

export interface TransformResult {
  /**
   * Files that have been included in this transformation.
   * Useful for telling bundlers to recompile the owning file if any of the included files change.
   */
  includedFiles: string[];

  /**
   * Transformed code.
   */
  code: string | null | undefined;
}
