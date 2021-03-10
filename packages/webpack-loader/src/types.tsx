export interface CompiledLoaderOptions {
  extract?: boolean;
  importReact?: boolean;
  nonce?: string;
}

export interface LoaderThis<TOptions = unknown> {
  /**
   * Query param passed to the loader.
   *
   * ```
   * import '!loader-module?query=params';
   * ```
   */
  resourceQuery: string;

  /**
   * Absolute path of this file.
   */
  resourcePath: string;

  /**
   * Returns the passed in options from a user.
   * Optionally validated with a `schema` object.
   */
  getOptions?: (schema?: {
    type: string;
    properties: Required<{ [P in keyof TOptions]: { type: string } }>;
  }) => TOptions;

  /**
   * Notifies webpack that this loader run included another file.
   * When the other file changes this file will be recompiled.
   */
  addDependency(path: string): void;

  /**
   * Marks the loader async.
   * Call the return value when the loader has completed.
   */
  async(): (err: any, result?: string, map?: any) => void;
}
