import * as ts from 'typescript';

export const hash = (): string => 'hash-test';

export const classNameHash = (): string => {
  return 'css-test';
};

export const cssVariableHash = (node: ts.Node): string => {
  try {
    return `--var-test-${node
      .getText()
      .toLowerCase()
      .split('?')[0]
      .trim()
      .replace(/ |=|'|"|\./g, '')}`;
  } catch (e) {
    return '--var-test';
  }
};
