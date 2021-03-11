import React, { useContext, createContext } from 'react';

const Cache = createContext<Record<string, true> | null>(null);

export const useCache = (): Record<string, true> => {
  return useContext(Cache) || {};
};

export const CompiledComponent = (props: {
  children: JSX.Element[] | JSX.Element;
}): JSX.Element => {
  return <Cache.Provider value={useCache()}>{props.children}</Cache.Provider>;
};

export function StyleStr(props: { children: string; nonce: string }): JSX.Element | null {
  const inserted = useCache();

  // The following code will not exist in the browser bundle.
  const sheets = props.children.split('.');
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

  return <style nonce={props.nonce}>{toInsert}</style>;
}

export function StyleArr(props: { children: string[]; nonce: string }): JSX.Element | null {
  const inserted = useCache();

  // The following code will not exist in the browser bundle.
  const sheets = props.children;
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

  return <style nonce={props.nonce}>{toInsert}</style>;
}
