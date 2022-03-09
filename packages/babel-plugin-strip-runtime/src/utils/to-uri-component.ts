/**
 * Escapes a CSS rule to be a valid query param.
 * Also escapes escalamation marks (!) to not confuse webpack.
 *
 * @param rule
 * @returns
 */
export const toURIComponent = (rule: string): string => {
  const component = encodeURIComponent(rule).replace(/!/g, '%21');

  return component;
};
