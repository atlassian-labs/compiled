// `sheet.cssRules` reflects rules added via `insertRule` (atomic buckets) as well as
// rules added as text (the non-atomic `cc` bucket, SSR), so it reads back both paths.
// The text comes back in the CSSOM's formatting, not Compiled's.

/** The CSS of each `<style>` in `root`, one string per element, in document order. */
export const getStyleCssTexts = (root: ParentNode = document.head): string[] =>
  Array.from(root.querySelectorAll('style'), (style) =>
    Array.from(style.sheet?.cssRules ?? [], (rule) => rule.cssText).join('')
  );

/** The CSS of every `<style>` in `root`, concatenated. */
export const getAllCssText = (root?: ParentNode): string => getStyleCssTexts(root).join('');
