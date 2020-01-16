const toHaveCompiledCss: jest.CustomMatcher = (
  element: HTMLElement,
  ...args: [{ [key: string]: string } | string, string]
) => {
  const [property, value] = args;
  const properties = typeof property === 'string' ? { [property]: value } : property;
  const styleElement = element.parentElement && element.parentElement.querySelector('style');
  const stylesToFind = Object.keys(properties).map(
    property => `${property}:${properties[property]}`
  );

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
    Object.entries(styles).forEach(([key, value]: any) => {
      css = css.replace(`var(${key})`, value);
    });
  }
  const notFoundStyles = stylesToFind.filter(styleToFind => !css.includes(styleToFind));

  if (css.includes(`.${element.className}`) && notFoundStyles.length === 0) {
    return {
      pass: true,
      message: () => '',
    };
  }

  return {
    pass: false,
    message: () => `Could not find "${notFoundStyles.join(
      ', '
    )}" on <${element.nodeName.toLowerCase()}> element.

Found styles:
${css}`,
  };
};

expect.extend({
  toHaveCompiledCss,
});
