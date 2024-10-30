import insertRule from './sheet';

export default function injectCss(sheets: string[]): void {
  for (const rule of sheets) {
    insertRule(rule, {});
  }
}
