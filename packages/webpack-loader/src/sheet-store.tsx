export const createStore = () => {
  const sheets: string[] = [];

  return {
    add: (newSheets: string[]) => sheets.push(...newSheets),

    get: () => sheets,

    flush: () => (sheets.length = 0),
  };
};
