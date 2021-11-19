import React, { createContext, useContext } from 'react';

const Cache = createContext<Record<string, true> | null>(null);

export const useCache = (): Record<string, true> => {
  return useContext(Cache) || {};
};

export type StyleStrProps = {
  children: string;
  nonce: string;
};

export function StyleStr({ children, nonce }: StyleStrProps): JSX.Element | null {
  const inserted = useCache();

  // The following code will not exist in the browser bundle.
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

export type StyleArrProps = {
  children: string[];
  nonce: string;
};

export function StyleArr({ children: sheets, nonce }: StyleArrProps): JSX.Element | null {
  const inserted = useCache();

  // The following code will not exist in the browser bundle.
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
