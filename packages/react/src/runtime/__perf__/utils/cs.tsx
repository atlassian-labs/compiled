import React, { createContext, useContext } from 'react';

const Cache = createContext<Record<string, true> | null>(null);

export type StyleBucketFromArrayProps = {
  children: string[];
  nonce: string;
};

export function StyleBucketFromArray({
  children: sheets,
  nonce,
}: StyleBucketFromArrayProps): JSX.Element | null {
  const inserted = useContext(Cache) || {};

  let toInsert = '';

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    if (inserted[sheet]) {
      continue;
    }
    toInsert += sheet;
  }

  if (!toInsert) {
    return null;
  }

  return <style nonce={nonce}>{toInsert}</style>;
}

export type StyleBucketFromStringProps = {
  children: string;
  nonce: string;
};

export function StyleBucketFromString({
  children,
  nonce,
}: StyleBucketFromStringProps): JSX.Element | null {
  const inserted = useContext(Cache) || {};

  const sheets = children.split('.');
  let toInsert = '';

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    if (inserted[sheet]) {
      continue;
    }
    toInsert += sheet;
  }

  if (!toInsert) {
    return null;
  }

  return <style nonce={nonce}>{toInsert}</style>;
}
