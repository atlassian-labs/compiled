import type { Media, StyleRules } from 'css';
import CSS from 'css';

import type { MatchFilter } from './types';

type Arg = [{ [key: string]: string }, MatchFilter?];

/**
 * Configuring the babel plugin with `increaseSpecificity: true` will result in this being appended to the end of generated classes.
 * TODO: Use the import from `@compiled/utils`, but doing so results in a circular TS reference, so it's copy and pasted..
 */
const INCREASE_SPECIFICITY_SELECTOR = ':not(#\\#)';
const DEFAULT_MATCH_FILTER: MatchFilter = { media: undefined, target: undefined };

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

const onlyRules = (rules?: StyleRules['rules']) => rules?.filter((r) => r.type === 'rule');

const findMediaRules = (
  allRules: StyleRules['rules'] = [],
  media: string
): Media['rules'] | undefined => {
  const rules: Media['rules'] = [];

  for (const rule of allRules) {
    if (!rule) {
      continue;
    }

    if ('media' in rule) {
      if (removeSpaces(rule.media) === removeSpaces(media) && 'rules' in rule && rule.rules) {
        rules.push(...rule.rules);
      } else if ('rules' in rule) {
        const found = findMediaRules(rule.rules, media);
        found && rules.push(...found);
      }
    }
  }

  return rules;
};

const getRules = (ast: CSS.Stylesheet, filter: MatchFilter, className: string) => {
  const { media, target } = filter;

  // rules are present directly inside ast.stylesheet.rules
  // but if a media query is present it is nested inside ast.stylesheet.media.rules
  // this inner function returns the relevant rules
  const getAllRules = () => {
    if (media) {
      return onlyRules(findMediaRules(ast.stylesheet?.rules, media));
    }
    return ast.stylesheet?.rules.filter((r) => (r.type = 'rule')); // omit media objects
  };

  const allRules = getAllRules();

  const klass = target ? `.${className}${target}` : `.${className}`;
  const klassIncreased = target
    ? `.${className}${INCREASE_SPECIFICITY_SELECTOR}${target}`
    : `.${className}${INCREASE_SPECIFICITY_SELECTOR}`;

  return allRules?.filter((r) => {
    if ('selectors' in r) {
      return r.selectors?.find((s) => {
        const sTrimmed = removeSpaces(s);
        return sTrimmed === removeSpaces(klass) || sTrimmed === removeSpaces(klassIncreased);
      });
    }
    return;
  });
};

const findStylesInRules = (styles: string[], rules: CSS.Rule[] | undefined) => {
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
    let css = styleElement.textContent || '';
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

    const ast = CSS.parse(css);
    classNames.forEach((c) => {
      const rules = getRules(ast, matchFilter, c);
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
