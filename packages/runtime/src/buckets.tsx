export type Bucket =
  | 'style'
  | 'link'
  | 'visited'
  | 'focus-within'
  | 'focus'
  | 'focus-visible'
  | 'hover'
  | 'active'
  | 'media';

const bucketsMapping: { [key: string]: Bucket } = {
  style: 'style',
  link: 'link',
  visited: 'visited',
  'focus-within': 'focus-within',
  focus: 'focus',
  'focus-visible': 'focus-visible',
  hover: 'hover',
  active: 'active',
  media: 'media',
};

export const buckets = [
  bucketsMapping.style,
  bucketsMapping.link,
  bucketsMapping.visited,
  bucketsMapping['focus-within'],
  bucketsMapping.focus,
  bucketsMapping['focus-visible'],
  bucketsMapping.hover,
  bucketsMapping.active,
  bucketsMapping.media,
];

export const getBucket = (sheet: string): Bucket => {
  if (sheet.startsWith('@media')) {
    return bucketsMapping.media;
  }

  const pseudoClassBucketResult = [
    bucketsMapping.link,
    bucketsMapping.visited,
    bucketsMapping['focus-within'],
    // Bringing 'focus-visible' before 'focus' to make sure it matches first otherwise
    // substring 'focus' will match even if input is 'focus-visible'
    bucketsMapping['focus-visible'],
    bucketsMapping.focus,
    bucketsMapping.hover,
    bucketsMapping.active,
  ].find((pseudoClassBucket) => sheet.includes(`:${pseudoClassBucket}`));

  if (pseudoClassBucketResult) {
    return pseudoClassBucketResult;
  }

  return bucketsMapping.style;
};

export const getCompiledAttr = (bucket: Bucket) => `data-compiled-${bucket}`;

export const groupByBucket = <T extends string, U extends T[]>(sheets: U) => {
  return sheets.reduce((accum, sheet) => {
    const bucket = getBucket(sheet);
    const bucketValue = accum[bucket];

    accum[bucket] = bucketValue ? [...bucketValue, sheet] : [sheet];

    return accum;
  }, {} as { [bucket in Bucket]: T[] });
};
