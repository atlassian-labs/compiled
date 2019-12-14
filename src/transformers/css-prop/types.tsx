import * as ts from 'typescript';
import SequentialCharacterGenerator from '../utils/sequential-chars';

export interface CssVariable {
  name: string;
  expression: ts.Expression;
}

export interface ProcessOpts {
  cssVariableIds: SequentialCharacterGenerator;
  scopedVariables: VariableStore;
}

export interface VariableStore {
  [moduleName: string]: ts.Node;
}
