import SequentialCharacterGenerator, { hash } from './sequential-chars';

const cssVariableIds = new SequentialCharacterGenerator();

export const nextClassName = (css: string): string => {
  return `css-${hash(css)}`;
};

export const nextCssVariableName = (): string => {
  return cssVariableIds.next();
};
