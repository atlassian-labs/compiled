import * as t from '@babel/types';

export interface State {
  compiledImportFound: boolean;
  declarations?: { [name: string]: t.VariableDeclaration | t.FunctionDeclaration };
}
