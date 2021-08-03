import { ImportDeclaration, Collection, JSCodeshift, ASTNode } from 'jscodeshift';

// We want to ensure the config contract is correct so devs can get type safety
type ValidateConfig<T, Struct> = T extends Struct
  ? Exclude<keyof T, keyof Struct> extends never
    ? T
    : never
  : never;

type BaseConfig = { j: JSCodeshift };

export type NodeSupplier = ASTNode | Array<ASTNode> | (() => ASTNode | Array<ASTNode>) | null;

export interface CodemodPlugin {
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
        currentNode: ImportDeclaration;
        defaultSpecifierName: string;
        namedImport: string;
        compiledImportPath: string;
      }
    >
  ): ImportDeclaration[];

  /**
   * Insert AST nodes before the compiled import
   *
   * @param config The configuration object
   * @param config.j The JSCodeshift object
   * @param config.newImport The new import node replaced in `buildImport`
   *
   * @returns Nodes to insert before the import
   */
  insertBeforeImport?<T>(
    config: ValidateConfig<T, BaseConfig & { newImport: Collection<ImportDeclaration> }>
  ): NodeSupplier;

  /**
   * Insert AST nodes after the compiled import
   *
   * @param config The configuration object
   * @param config.j The JSCodeshift object
   * @param config.newImport The new import node replaced in `buildImport`
   *
   * @returns Nodes to insert after the import
   */
  insertAfterImport?<T>(
    config: ValidateConfig<T, BaseConfig & { newImport: Collection<ImportDeclaration> }>
  ): NodeSupplier;
}
