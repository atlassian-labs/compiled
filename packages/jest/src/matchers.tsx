const kebabCase = (str: string) =>
  str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();

const mapProperties = (properties: Record<string, any>) =>
  Object.keys(properties).map(property => `${kebabCase(property)}:${properties[property]}`);

const getMountedProperties = () =>
  Array.from(document.styleSheets)
    .map(sheet =>
      // @ts-ignore
      sheet.cssRules.map((rule: CSSRule) => rule.style.cssText)
    )
    .join(' ');

// sorry but using ? was throwing TS off
type Arg = [{ [key: string]: string }, MatchFilter?];
export function toHaveCompiledCss(
  this: jest.MatcherUtils,
  element: HTMLElement,
  ...args: [Arg | string, string, MatchFilter?]
): jest.CustomMatcherResult {
  const [property, value, matchFilter] = args;
  const { media, state } = matchFilter || { media: undefined, state: undefined };
  const properties = typeof property === 'string' ? { [property]: value } : property;
  const inlineStyleTag = element.parentElement && element.parentElement.querySelector('style');
  const styleElements: HTMLStyleElement[] =
    inlineStyleTag != null ? [inlineStyleTag] : Array.from(document.head.querySelectorAll('style'));

  if (!styleElements) {
    return {
      pass: false,
      message: () => 'pairing style element was not found',
    };
  }

  const stylesToFind = mapProperties(properties);
  const foundStyles: string[] = [];
  const classNames = element.className.split(' ');

  for (const styleElement of styleElements) {
    let css = styleElement.textContent || '';
    // This is a hack to get ahold of the styles.
    // Unfortunately JSDOM doesn't handle css variables properly
    // See: https://github.com/jsdom/jsdom/issues/1895
    // @ts-ignore
    const styles = element[Object.keys(element)[0]].memoizedProps.style;

    if (styles && Object.keys(styles).length > 0) {
      Object.entries(styles).forEach(([key, value]: [string, any]) => {
        // Replace all instances of var with the value.
        // We split and join to replace all instances without needing to jump into a dynamic regex.
        css = css.split(`var(${key})`).join(value);
      });
    }

    classNames.forEach(c => {
      let matcher = c;
      if (state) matcher += `:${state}`;
      if (media) matcher = `${media}{.*${matcher}`;
      if (css.match(matcher)) {
        foundStyles.push(...stylesToFind.filter(s => css.includes(s)));
      }
    });
  }

  const notFoundStyles = stylesToFind.filter(style => !foundStyles.includes(style));
  const foundFormatted = stylesToFind.join(', ');
  const notFoundFormatted = notFoundStyles.join(', ');

  if (foundStyles.length > 0 && notFoundStyles.length === 0) {
    return {
      pass: true,
      message: !this.isNot
        ? () => ''
        : () =>
            `Found "${foundFormatted}" on <${element.nodeName.toLowerCase()} css={\`${getMountedProperties()}\`}> element.`,
    };
  }

  return {
    pass: false,
    message: () =>
      `Could not find "${notFoundFormatted}" on <${element.nodeName.toLowerCase()} css={\`${getMountedProperties()}\`}> element.`,
  };
}
