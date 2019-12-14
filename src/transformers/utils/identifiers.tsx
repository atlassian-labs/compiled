import SequentialCharacterGenerator from '../utils/sequential-chars';

const classNameIds = new SequentialCharacterGenerator();
const cssVariableIds = new SequentialCharacterGenerator();

export const nextClassName = (): string => {
  return classNameIds.next();
};

export const nextCssVariableName = (): string => {
  return cssVariableIds.next();
};
