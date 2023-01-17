/**
 * Returns an array with unique elements.
 * Use `getId` to customize what uniquely identifies each array element.
 *
 * @param arr
 * @param getId
 */
export const unique = <TArrItem>(
  arr: TArrItem[],
  getId: (item: TArrItem) => any = (item) => item
): TArrItem[] => {
  return arr.reduce((acc, item) => {
    const id = getId(item);
    if (!acc.find((find) => getId(find) === id)) {
      acc.push(item);
    }

    return acc;
  }, [] as TArrItem[]);
};

/**
 * Flattens nested arrays into a single array.
 * `[1, [2, 3]]` becomes `[1, 2, 3]`.
 *
 * @param arrays
 */
export const flatten = <TArr extends Record<string, unknown>>(...arrays: TArr[][]): TArr[] => {
  return arrays.reduce((acc, arr) => acc.concat(arr), []);
};
