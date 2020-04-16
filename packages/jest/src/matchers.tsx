const kebabCase = (str: string) =>
  str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();

export function toHaveCompiledCss(
  this: jest.MatcherUtils,
  element: HTMLElement,
  ...args: [{ [key: string]: string } | string, string]
): jest.CustomMatcherResult {
  const [property, value] = args;
  const properties = typeof property === 'string' ? { [property]: value } : property;
  let styleElement = element.parentElement && element.parentElement.querySelector('style');

  if (!styleElement) {
    // There wasn't a style element found within - let's check the head for it instead.
    const styleElements = Array.from(document.head.querySelectorAll('style'));
    for (const tag of styleElements) {
      if (tag.innerHTML.includes(element.className)) {
        styleElement = tag as HTMLStyleElement;
        break;
      }
    }
  }

  if (!styleElement) {
    return {
      pass: false,
      message: () => 'pairing style element was not found',
    };
  }

  // This is a hack to get ahold of the styles.
  // Unfortunately JSDOM doesn't handle css variables properly
  // See: https://github.com/jsdom/jsdom/issues/1895
  // @ts-ignore
  const styles = element[Object.keys(element)[0]].memoizedProps.style;
  let css = styleElement.textContent || '';

  if (styles && Object.keys(styles).length > 0) {
    Object.entries(styles).forEach(([key, value]: [string, any]) => {
      // Replace all instances of var with the value.
      // We split and join to replace all instances without needing to jump into a dynamic regex.
      css = css.split(`var(${key})`).join(value);
    });
  }

  const stylesToFind = Object.keys(properties).map(
    property => `${kebabCase(property)}:${properties[property]}`
  );
  const foundStyles = stylesToFind.filter(styleToFind => css.includes(styleToFind));
  const notFoundStyles = stylesToFind.filter(styleToFind => !css.includes(styleToFind));
  const includedSelector = css.includes(`.${element.className}`);

  if (includedSelector && foundStyles.length > 0 && notFoundStyles.length === 0) {
    return {
      pass: true,
      message: !this.isNot
        ? () => ''
        : () => `Found "${foundStyles.join(', ')}" on <${element.nodeName.toLowerCase()} ${styles &&
            `style={${JSON.stringify(styles)}}`}> element.

  Reconciled css (css variables replaced with actual values):
  ${css}

  Original css:
  ${(styleElement && styleElement.textContent) || ''}
  `,
    };
  }

  return {
    pass: false,
    message: () => `Could not find "${notFoundStyles.join(
      ', '
    )}" on <${element.nodeName.toLowerCase()} ${styles &&
      `style={${JSON.stringify(styles)}}`}> element.

Reconciled css (css variables replaced with actual values):
${css}

Original css:
${(styleElement && styleElement.textContent) || ''}
`,
  };
}
