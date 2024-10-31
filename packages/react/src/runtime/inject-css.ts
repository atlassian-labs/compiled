import insertRule from './sheet';

const cache = new Set();

export default function injectCss(sheets: string[]): void {
  for (const rule of sheets) {
    if (cache.has(rule)) continue;
    insertRule(rule, {});
    cache.add(rule);
  }
}
