export const titleCase = (str: string) => {
  const parsedStr = str.replace(/\d+-/, '');
  return `${parsedStr[0].toUpperCase()}${parsedStr
    .slice(1)
    .toLowerCase()
    .split('-')
    .join(' ')
    .replace(/\s\w/g, (found) => found.toUpperCase())}`;
};
