import type { CssAtRuleAST, CssRuleAST, CssStylesheetAST } from '@adobe/css-tools';
import { CssTypes, parse } from '@adobe/css-tools';

import type { MatchFilter } from './types';

type Arg = [{ [key: string]: string }, MatchFilter?];

/**
 * Configuring the babel plugin with `increaseSpecificity: true` will result in this being appended to the end of generated classes.
 * TODO: Use the import from `@compiled/utils`, but doing so results in a circular TS reference, so it's copy and pasted..
 */
const INCREASE_SPECIFICITY_SELECTOR = ':not(#\\#)';
const DEFAULT_MATCH_FILTER: MatchFilter = {};

const kebabCase = (str: string) =>
  str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();

const removeSpaces = (str?: string) => str && str.replace(/\s/g, '');

const mapProperties = (properties: Record<string, any>) =>
  Object.keys(properties).map((property) => {
    const key = property.startsWith('--') ? property : kebabCase(property);
    return `${key}:${properties[property]}`;
  });

/**
 * Reads the CSS text out of a `<style>` element.
 *
 * The browser runtime injects rules with `sheet.insertRule()`, a CSSOM-only mutation
 * that leaves the element's `textContent` empty — so those rules have to be read back
 * off the sheet. Server-rendered styles and non-atomic `cssMapScoped` rules still live
 * in a text node, hence the `textContent` is preferred when present.
 *
 * Preferring text is only safe because no `<style>` ever holds CSS in both places:
 * atomic rules go exclusively through `insertRule`, non-atomic ones exclusively through
 * `Text.appendData` on the dedicated `cc` bucket, and the two never share an element
 * (see `styleBucketOrdering` and `insertNonAtomicRule` in `react/src/runtime/sheet.ts`).
 * Atomic buckets are created holding an *empty* text node, which is falsy and so falls
 * through to the sheet.
 */
const getCssText = (styleElement: HTMLStyleElement): string => {
  if (styleElement.textContent) {
    return styleElement.textContent;
  }

  const { sheet } = styleElement;

  return sheet ? Array.from(sheet.cssRules, (rule) => rule.cssText).join('') : '';
};

/**
 * The at-rules a style rule is nested in, as seen from the rule itself.
 * For `media`, `container` and `supports` the innermost condition wins, which keeps the
 * existing `media` behaviour where a filter matches the closest `@media` block.
 */
interface AtRuleContext {
  media?: string;
  container?: string;
  supports?: string;
  layer?: string;
  startingStyle?: boolean;
}

interface ContextualRule {
  rule: CssRuleAST;
  context: AtRuleContext;
}

/**
 * Walks the stylesheet and returns every style rule along with the at-rules it is nested in.
 * At-rules that can't be targeted by a `MatchFilter` (e.g. `@keyframes`, `@font-face`) are skipped.
 */
const collectRules = (
  nodes: CssAtRuleAST[] = [],
  context: AtRuleContext = {},
  collected: ContextualRule[] = []
): ContextualRule[] => {
  for (const node of nodes) {
    if (!node) {
      continue;
    }

    switch (node.type) {
      case CssTypes.rule:
        collected.push({ rule: node, context });
        break;

      case CssTypes.media:
        collectRules(node.rules, { ...context, media: node.media }, collected);
        break;

      case CssTypes.container:
        collectRules(node.rules, { ...context, container: node.container }, collected);
        break;

      case CssTypes.supports:
        collectRules(node.rules, { ...context, supports: node.supports }, collected);
        break;

      case CssTypes.layer:
        // Layer statements such as `@layer a, b;` have no rules.
        if (node.rules) {
          const layer = context.layer ? `${context.layer}.${node.layer}` : node.layer;
          collectRules(node.rules, { ...context, layer: layer.trim() }, collected);
        }
        break;

      case CssTypes.startingStyle:
        collectRules(node.rules, { ...context, startingStyle: true }, collected);
        break;

      default:
        break;
    }
  }

  return collected;
};

const conditionMatches = (expected: string | undefined, actual: string | undefined) =>
  expected ? removeSpaces(actual) === removeSpaces(expected) : actual === undefined;

/**
 * A rule matches when every at-rule named in the filter wraps it, and it is not wrapped in
 * any at-rule the filter leaves out, so `{ media }` doesn't also match styles that only
 * apply inside a container query.
 */
const contextMatches = (context: AtRuleContext, filter: MatchFilter) =>
  conditionMatches(filter.media, context.media) &&
  conditionMatches(filter.container, context.container) &&
  conditionMatches(filter.supports, context.supports) &&
  conditionMatches(filter.layer, context.layer) &&
  !!filter.startingStyle === !!context.startingStyle;

/**
 * Returns the style rules whose at-rule context matches the filter.
 */
const getRulesInContext = (ast: CssStylesheetAST, filter: MatchFilter): CssRuleAST[] =>
  collectRules(ast.stylesheet?.rules)
    .filter(({ context }) => contextMatches(context, filter))
    .map(({ rule }) => rule);

const getRules = (allRules: CssRuleAST[], filter: MatchFilter, className: string) => {
  const { target } = filter;

  const klass = target ? `.${className}${target}` : `.${className}`;
  const klassIncreased = target
    ? `.${className}${INCREASE_SPECIFICITY_SELECTOR}${target}`
    : `.${className}${INCREASE_SPECIFICITY_SELECTOR}`;

  return allRules.filter((r) =>
    r.selectors?.find((s) => {
      const sTrimmed = removeSpaces(s);
      return sTrimmed === removeSpaces(klass) || sTrimmed === removeSpaces(klassIncreased);
    })
  );
};

const findStylesInRules = (styles: string[], rules: CssAtRuleAST[] | undefined) => {
  const found: string[] = [];
  const similar: string[] = [];

  if (rules) {
    styles.forEach((s) => {
      rules?.forEach((r) => {
        if ('declarations' in r) {
          r.declarations?.forEach((d) => {
            if ('property' in d) {
              if (s === `${d.property}:${d.value}`) {
                // We found this exact match, eg. `color:#fff`
                found.push(s);
              } else if (s.split(':')[0] === d.property) {
                // We found something similar by property, eg. `color:#fff` vs. `color:#333`
                similar.push(`${d.property}:${d.value}`);
              }
            }
          });
        }
      });
    });
  }

  return { found, similar };
};

export function toHaveCompiledCss(
  this: jest.MatcherUtils,
  element: HTMLElement,
  ...args: [Arg | string, string, MatchFilter?]
): jest.CustomMatcherResult {
  const [property, value, matchFilter = DEFAULT_MATCH_FILTER] = args;
  const properties = typeof property === 'string' ? { [property]: value } : property;
  const styleElements: HTMLStyleElement[] = [
    ...Array.from(document.body.querySelectorAll('style')),
    ...Array.from(document.head.querySelectorAll('style')),
  ];

  if (!styleElements) {
    return {
      pass: false,
      message: () => 'pairing style element was not found',
    };
  }

  const stylesToFind = mapProperties(properties);
  const foundStyles: string[] = [];
  const similarStyles: string[] = [];
  const classNames = element.classList;

  for (const styleElement of styleElements) {
    let css = getCssText(styleElement);
    // This is a hack to get ahold of the styles.
    // Unfortunately JSDOM doesn't handle css variables properly
    // See: https://github.com/jsdom/jsdom/issues/1895
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const styles = element[Object.keys(element)[0]].memoizedProps.style;

    if (styles && Object.keys(styles).length > 0) {
      Object.entries(styles).forEach(([key, value]: [string, any]) => {
        // Replace all instances of var with the value.
        // We split and join to replace all instances without needing to jump into a dynamic regex.
        css = css.split(`var(${key})`).join(value);
      });
    }

    const rulesInContext = getRulesInContext(parse(css), matchFilter);
    classNames.forEach((c) => {
      const rules = getRules(rulesInContext, matchFilter, c);
      const search = findStylesInRules(stylesToFind, rules);

      foundStyles.push(...search.found);
      similarStyles.push(...search.similar);
    });
  }

  const notFoundStyles = stylesToFind.filter((style) => !foundStyles.includes(style));
  const foundFormatted = stylesToFind.join(', ');

  if (foundStyles.length > 0 && notFoundStyles.length === 0) {
    return {
      pass: true,
      message: !this.isNot
        ? () => ''
        : () => `Found "${foundFormatted}" on ${element.outerHTML} element.`,
    };
  }

  const notFoundFormatted = notFoundStyles.join(', ');
  const notFoundProperties = notFoundStyles.map((style) => style.split(':')[0]);
  const similarStylesFormatted = similarStyles
    .reduce<string[]>((acc, keyValue) => {
      const property = keyValue.split(':')[0];

      if (notFoundProperties.includes(property)) {
        acc.push(keyValue);
      }
      return acc;
    }, [])
    .join('\r\n');
  const similarStylesMessage = !similarStylesFormatted
    ? 'Found 0 styles with matching properties.'
    : `Found similar styles:
${similarStylesFormatted}`;

  return {
    pass: false,
    message: () => `Could not find "${notFoundFormatted}" on ${element.outerHTML} element.

${similarStylesMessage}`,
  };
}
