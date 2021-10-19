const selectorsToWarn = [':first-child', ':nth-child'];
const hasWarned: Record<string, true> = {};

const warn = (str: string, ...args: any[]): void =>
  console.error(
    `
 ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗██╗     ███████╗██████╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║██║     ██╔════╝██╔══██╗
██║     ██║   ██║██╔████╔██║██████╔╝██║██║     █████╗  ██║  ██║
██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║██║     ██╔══╝  ██║  ██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║███████╗███████╗██████╔╝
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═════╝

  @compiled/react/runtime - DEV WARNING

  ${str}
`,
    ...args
  );

export const analyzeCssInDev = (sheet: string): void => {
  if (hasWarned[sheet]) {
    return;
  }

  const shouldWarnAboutSelectors =
    selectorsToWarn.map((selector) => sheet.includes(selector)).filter(Boolean).length > 0;

  if (shouldWarnAboutSelectors) {
    warn(
      `Selectors "${selectorsToWarn.join(', ')}" are dangerous to use when server side rendering.
  Alternatively try and use ":nth-of-type", or placing data attributes and targetting those instead.
  Read https://compiledcssinjs.com/docs/server-side-rendering for more advice.`
    );
  }

  hasWarned[sheet] = true;
};
