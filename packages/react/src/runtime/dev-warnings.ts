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

const previewValue = (value: unknown): string => {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      return String(value);
    }
    return serialized.length > 60 ? `${serialized.slice(0, 57)}...` : serialized;
  } catch {
    return String(value);
  }
};

/**
 * Warn when `ax()` is given anything other than a precompiled class-name
 * string (or one of its supported falsy placeholders).
 *
 * The most common cause is forgetting to wrap a raw style object with
 * `css({...})` before passing it to a `css` prop or a styled component, which
 * lets a plain `{ color: 'red' }` flow into `ax()` and produces a cryptic
 * runtime crash (`classNames[0].includes is not a function`) instead of an
 * actionable error.
 *
 * Dev-only — production callers do not pay any cost because the call site in
 * `ax()` is gated behind `process.env.NODE_ENV === 'development'`, which
 * bundlers DCE in production builds.
 */
export const analyzeAxInputInDev = (classNames: readonly unknown[]): void => {
  for (let i = 0; i < classNames.length; i++) {
    const value = classNames[i];
    // The same falsy values `ax()` itself ignores.
    if (value == null || value === false || value === '') {
      continue;
    }
    if (typeof value === 'string') {
      continue;
    }

    const key = `ax-input-${typeof value}`;
    if (hasWarned[key]) {
      return;
    }
    hasWarned[key] = true;

    warn(
      `ax() received ${
        typeof value === 'object' ? 'an object' : `a ${typeof value}`
      } (\`${previewValue(value)}\`) at index ${i}.
  Compiled expects precompiled className strings here. If you passed a raw style object to a \`css\` prop or styled component — for example \`<MyComponent css={{ color: 'red' }} />\` — wrap it with \`css({...})\` so Compiled can transform it at build time:
      <MyComponent css={css({ color: 'red' })} />`
    );

    return;
  }
};
