const toHaveCompiledCss: jest.CustomMatcher = (element: HTMLElement, ...args: [string, string]) => {
  const [property, value] = args;
  const styleElement = element.parentElement && element.parentElement.querySelector('style');
  const styleToFind = `${property}:${value}`;

  if (!styleElement) {
    return {
      pass: false,
      message: () => 'pairing style element was not found',
    };
  }

  if (
    styleElement.textContent &&
    styleElement.textContent.includes(`.${element.className}`) &&
    styleElement.textContent.includes(styleToFind)
  ) {
    return {
      pass: true,
      message: () => '',
    };
  }

  return {
    pass: false,
    message: () => `Could not find "${styleToFind}" on <${element.nodeName.toLowerCase()}> element.

Found styles:
${styleElement.textContent}`,
  };
};

expect.extend({
  toHaveCompiledCss,
});
