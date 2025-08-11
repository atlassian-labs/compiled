/**
 * SWC Plugin2 for @compiled/react - focused on xcss-prop functionality
 * High-performance CSS-in-JS transformations using Rust and WebAssembly
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CompiledSwcPluginOptions {
  /**
   * Import sources to transform CSS-in-JS from
   * @default ["@compiled/react"]
   */
  importSources?: string[];

  /**
   * Enable development mode features like display names and better error messages
   * @default false
   */
  development?: boolean;

  /**
   * Custom runtime import path for compiled utilities
   * @default "@compiled/react/runtime"
   */
  runtimeImport?: string;

  /**
   * Prefix for generated CSS class names
   * @default "_"
   */
  classNamePrefix?: string;

  /**
   * Enable CSS minification
   * @default true
   */
  minifyCss?: boolean;

  /**
   * Add component names as class names in development
   * @default false
   */
  addComponentName?: boolean;

  /**
   * Class name compression map for smaller bundles
   * @default undefined
   */
  classNameCompressionMap?: { [key: string]: string };

  /**
   * Prefix for generated classes' hashes
   * @default undefined
   */
  classHashPrefix?: string;

  /**
   * Whether to process xcss usages
   * @default true
   */
  processXcss?: boolean;
}

/**
 * Get the path to the WASM plugin file
 */
export function getWasmPluginPath(): string {
  // Prefer packaged WASM at package root (production)
  const packaged = path.join(__dirname, '..', 'compiled_swc_plugin.wasm');
  if (fs.existsSync(packaged)) return packaged;
  // Fallback to target directory (development)
  return path.join(
    __dirname,
    '..',
    'target',
    'wasm32-wasip1',
    'release',
    'compiled_swc_plugin.wasm'
  );
}

/**
 * Check if the WASM plugin exists
 */
export function isWasmPluginAvailable(): boolean {
  return fs.existsSync(getWasmPluginPath());
}

/**
 * Create SWC plugin configuration with sensible defaults
 */
export function createPluginConfig(
  options: CompiledSwcPluginOptions = {}
): CompiledSwcPluginOptions {
  return {
    importSources: options.importSources || ['@compiled/react'],
    development: options.development || false,
    runtimeImport: options.runtimeImport || '@compiled/react/runtime',
    classNamePrefix: options.classNamePrefix || '_',
    minifyCss: options.minifyCss !== false,
    addComponentName: options.addComponentName || false,
    classNameCompressionMap: options.classNameCompressionMap,
    classHashPrefix: options.classHashPrefix,
    processXcss: options.processXcss !== false,
  };
}

/**
 * Get the SWC plugin configuration for use with @swc/core
 * Returns [wasmPath, pluginOptions] tuple for use in SWC experimental.plugins
 */
export function getSwcPlugin(
  options: CompiledSwcPluginOptions = {}
): [string, CompiledSwcPluginOptions] {
  const wasmPath = getWasmPluginPath();

  if (!isWasmPluginAvailable()) {
    throw new Error(`SWC plugin WASM file not found at: ${wasmPath}`);
  }

  const config = createPluginConfig(options);

  return [wasmPath, config];
}

// Re-export types for convenience
export type { CompiledSwcPluginOptions as PluginOptions };

// Default export for easy importing
export default {
  getWasmPluginPath,
  isWasmPluginAvailable,
  createPluginConfig,
  getSwcPlugin,
};
