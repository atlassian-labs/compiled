const toHaveCompiledCss: jest.CustomMatcher = (element: HTMLElement, ...args: [string, string]) => {
  const [property, value] = args;
  const styleElement = element.parentElement && element.parentElement.querySelector('style');
  const styleToFind = `${property}:${value};`;

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

  if (css.includes(`.${element.className}`) && css.includes(styleToFind)) {
    return {
      pass: true,
      message: () => '',
    };
  }

  return {
    pass: false,
    message: () => `Could not find "${styleToFind}" on <${element.nodeName.toLowerCase()}> element.

Found styles:
${css}`,
  };
};

expect.extend({
  toHaveCompiledCss,
});
