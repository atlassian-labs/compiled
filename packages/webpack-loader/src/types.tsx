import { createStore } from './utils/sheet-store';

export type SheetStore = ReturnType<typeof createStore>;

/**
 * Options that the webpack loader can take.
 */
export interface LoaderOptions {
  /**
   * Will extract styles to an external stylesheet when `true`.
   * Requires a pairing `CompiledExtractPlugin` to be configured.
   *
   * Defaults to `false`.
   */
  extract?: boolean;

  /**
   * When `true` `React` will be imported into the module if it is missing.
   * When using JSX `runtime` as `"automatic"` you can set this to `false`.
   *
   * Defaults to `true`.
   */
  importReact?: boolean;

  /**
   * Used when wanting CSP support.
   */
  nonce?: string;

  /**
   * @private
   * Sheet store that is injected by the `CompiledExtractPlugin`.
   */
  __sheetStore?: SheetStore;
}
