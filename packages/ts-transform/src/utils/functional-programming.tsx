export const concatArrays = <TArr extends {}>(...assignments: TArr[][]): TArr[] => {
  return assignments.reduce((acc, arr) => acc.concat(arr), []);
};
