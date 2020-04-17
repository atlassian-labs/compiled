const selectorsToWarn = [':first-child', ':nth-child'];
const hasWarned: Record<string, true> = {};

export const warn = (str: string, ...args: any[]) =>
  console.error(
    `
 ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗██╗     ███████╗██████╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║██║     ██╔════╝██╔══██╗
██║     ██║   ██║██╔████╔██║██████╔╝██║██║     █████╗  ██║  ██║
██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║██║     ██╔══╝  ██║  ██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║███████╗███████╗██████╔╝
  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═════╝

  @compiled/css-in-js - DEV WARNING

  ${str}
`,
    ...args
  );

export const analyzeCssInDev = (css: string[], hash: string) => {
  if (hasWarned[hash]) {
    return;
  }

  css.forEach(block => {
    const shouldWarnAboutSelectors =
      selectorsToWarn.map(selector => block.includes(selector)).filter(Boolean).length > 0;

    if (shouldWarnAboutSelectors) {
      warn(
        `Selectors "${selectorsToWarn.join(', ')}" are dangerous to use when server side rendering.
  Alternatively try and use ":nth-of-type", or placing data attributes and targetting those instead.
  Read https://compiledcssinjs.com/docs/server-side-rendering for more advice.`
      );
    }
  });

  hasWarned[hash] = true;
};
