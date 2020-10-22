import { Bucket } from './types';

export const buckets: Bucket[] = ['', 'l', 'v', 'fw', 'f', 'fv', 'h', 'a', 'm'];

// NOTE: If we are adding/removing anything from this list, Please also update the
// the list in css package. Going forward we might move this common
// variable in separate package.
const pseudosMap: { [key: string]: Exclude<Bucket, '' | 'm'> } = {
  link: 'l',
  visited: 'v',
  'focus-within': 'fw',
  focus: 'f',
  'focus-visible': 'fv',
  hover: 'h',
  active: 'a',
};

/**
 * Gets the bucket depending on the sheet.
 *
 * For eg.
 * `getBucket('._a1234567:hover{ color: red; }')` will return `h` i.e. hover bucket
 *
 * @param sheet styles for which we are getting the bucket
 */
export const getBucket = (sheet: string): Bucket => {
  // `64` corresponds to `@` i.e. at-rules. We are grouping all the at-rules
  // like @media, @supports etc under `m` bucket for now.
  if (sheet.charCodeAt(0) === 64) {
    return 'm';
  }

  // `58` corresponds to `:`. Here we are assuming that classname will always be
  // 9 character long. After getting pseudo class between `:` and `,` or `{`
  // (comma when we have multiple selectors like `sel1, sel2{}`), we are
  // returning its corresponding bucket.
  if (sheet.charCodeAt(10) === 58) {
    const commaIndex = sheet.indexOf(',');
    const openBracketIndex = sheet.indexOf('{');
    const name = sheet.slice(11, commaIndex !== -1 ? commaIndex : openBracketIndex);
    const pseudoBucket = pseudosMap[name];

    if (pseudoBucket) {
      return pseudoBucket;
    }
  }

  // Return default catch all bucket
  return '';
};

/**
 * Group sheets by bucket.
 *
 * @returns { 'h': ['._a1234567:hover{ color: red; }', '._a1234567:hover{ color: green; }'] }
 * @param sheets styles which are grouping under bucket
 */
export const groupByBucket = <T extends string, U extends T[]>(sheets: U) => {
  return sheets.reduce((accum, sheet) => {
    const bucket = getBucket(sheet);
    const bucketValue = accum[bucket];

    accum[bucket] = bucketValue ? bucketValue.concat(sheet) : [sheet];

    return accum;
  }, {} as Record<Bucket, T[]>);
};
