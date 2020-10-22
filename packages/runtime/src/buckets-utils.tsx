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

export const getBucket = (sheet: string): Bucket => {
  if (sheet.charCodeAt(0) === 64) {
    return 'm';
  }

  if (sheet.charCodeAt(10) === 58) {
    const openBracketIndex = sheet.indexOf('{');
    const name = sheet.slice(11, openBracketIndex);
    const pseudoBucket = pseudosMap[name];

    if (pseudoBucket) {
      return pseudoBucket;
    }
  }

  return '';
};

export const groupByBucket = <T extends string, U extends T[]>(sheets: U) => {
  return sheets.reduce((accum, sheet) => {
    const bucket = getBucket(sheet);
    const bucketValue = accum[bucket];

    accum[bucket] = bucketValue ? bucketValue.concat(sheet) : [sheet];

    return accum;
  }, {} as { [bucket in Bucket]: T[] });
};
