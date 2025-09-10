import * as fs from 'fs';
import * as path from 'path';

export interface PluginOptions2 {
  importSources?: string[]; // default ['@compiled/react', '@atlaskit/css']
  development?: boolean;
  runtimeImport?: string; // '@compiled/react/runtime'
  extract?: boolean; // when true remove CC/CS and emit sheets as consts
  extractStylesToDirectory?: { source: string; dest: string };
  filename?: string;
  sourceFileName?: string;
  styleSheetPath?: string;
}

export function getWasmPluginPath2(): string {
  const packaged = path.join(__dirname, '..', 'compiled_swc_plugin2.wasm');
  if (fs.existsSync(packaged)) return packaged;
  return path.join(
    __dirname,
    '..',
    'target',
    'wasm32-wasip1',
    'release',
    'compiled_swc_plugin2.wasm'
  );
}

export function isWasmPluginAvailable2(): boolean {
  return fs.existsSync(getWasmPluginPath2());
}

export function createPluginConfig2(options: PluginOptions2 = {}): Required<PluginOptions2> {
  return {
    importSources: options.importSources || ['@compiled/react', '@atlaskit/css'],
    development: options.development || false,
    runtimeImport: options.runtimeImport || '@compiled/react/runtime',
    extract: options.extract ?? true,
    extractStylesToDirectory: options.extractStylesToDirectory || (undefined as any),
    filename: options.filename || '',
    sourceFileName: options.sourceFileName || '',
    styleSheetPath: options.styleSheetPath || (undefined as any),
  };
}

/**
 * Returns true if the given code string should be transformed by the plugin,
 * based on the presence of any configured import sources.
 */
export function shouldEnableForCode2(code: string, options: PluginOptions2 = {}): boolean {
  const cfg = createPluginConfig2(options);
  return cfg.importSources.some((s) => code.includes(s));
}

export function getSwcPlugin2(options: PluginOptions2 = {}): [string, Required<PluginOptions2>] {
  const wasmPath = getWasmPluginPath2();
  if (!isWasmPluginAvailable2()) {
    throw new Error(`SWC plugin WASM file not found at: ${wasmPath}`);
  }
  const config = createPluginConfig2(options);
  return [wasmPath, config];
}

export default {
  getWasmPluginPath2,
  isWasmPluginAvailable2,
  createPluginConfig2,
  shouldEnableForCode2,
  getSwcPlugin2,
};
