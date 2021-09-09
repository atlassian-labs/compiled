import type { ImportDeclaration, JSCodeshift, Program } from 'jscodeshift';

// We want to ensure the config contract is correct so devs can get type safety
type ValidateConfig<T, Struct> = T extends Struct
  ? Exclude<keyof T, keyof Struct> extends never
    ? T
    : never
  : never;

export interface PluginMetadata {
  name: string;
}

type BaseConfig = {
  processedPlugins: Array<PluginMetadata>;
  j: JSCodeshift;
};

/**
 * Visitor interface for interacting with the AST
 */
export interface Visitor {
  /**
   * Program visitor
   *
   * @param config The configuration object
   * @param config.processedPlugins The plugins processed so far
   * @param config.j The JSCodeshift object
   * @param config.originalProgram The initial state of the program (before any processing)
   * @param config.program The current state of the program
   */
  program?<T>(
    config: ValidateConfig<
      T,
      BaseConfig & {
        originalProgram: Program;
        program: Program;
      }
    >
  ): void;
}

/**
 * Interface for codemods that handle migration from CSS-in-JS libraries to Compiled
 */
export interface MigrationTransformer {
  /**
   * Build the compiled import replacing the existing import
   *
   * @param config The configuration object
   * @param config.j The JSCodeshift object
   * @param config.currentNode The existing import node that will be replaced
   * @param config.defaultSpecifierName The import name
   * @param config.namedImport The export from Compiled to be imported
   * @param config.compiledImportPath The import path for Compiled
   *
   * @returns The import to replace config.currentNode
   */
  buildImport?<T>(
    config: ValidateConfig<
      T,
      BaseConfig & {
        originalNode: ImportDeclaration;
        currentNode: ImportDeclaration;
        defaultSpecifierName: string;
        namedImport: string;
        compiledImportPath: string;
      }
    >
  ): ImportDeclaration;
}

export interface CodemodPlugin {
  metadata: PluginMetadata;
  visitor?: Visitor;
  migrationTransform?: MigrationTransformer;
}
