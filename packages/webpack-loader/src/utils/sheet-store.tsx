/**
 * Returns a store that is used to store data during a webpack compilation run.
 */
export const createStore = () => {
  const sheets: string[] = [];

  return {
    /**
     * Adds sheets into the store.
     *
     * @param newSheets
     */
    add: (newSheets: string[]) => sheets.push(...newSheets),

    /**
     * Returns the stored sheets.
     */
    get: () => sheets,

    /**
     * Clears the sheets.
     */
    flush: () => (sheets.length = 0),
  };
};
