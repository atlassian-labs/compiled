import Stylis from 'stylis';
// @ts-ignore
import stylisRuleSheet from 'stylis-rule-sheet';

export const stylis = (selector: string, css: string): string[] => {
  const sheets: string[] = [];
  const styl = new Stylis({});
  const ruleSheetPlugin = stylisRuleSheet((rule: string) => sheets.push(rule));

  styl.use(ruleSheetPlugin);
  styl(selector, css);

  return sheets;
};
