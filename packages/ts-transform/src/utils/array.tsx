export const unique = <TArrItem extends {}>(
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
