import ax from './runtime/ax';
import insertRule from './runtime/sheet';
import type { AnyKeyCssProps, CSSProps } from './types';
import { createSetupError } from './utils/error';

type ClassNames = string | false | undefined;

export const Style = (classNames: ClassNames[]): string | undefined => {
  return ax(classNames);
};

Style.create = <TKeys extends string>(
  _styles: Record<TKeys, AnyKeyCssProps<void> | CSSProps>
): Record<TKeys, string> => {
  if (process.env.NODE_ENV !== 'production') {
    throw createSetupError();
  }

  throw 'cmpld1';
};

const cache: Record<string, true> = {};

export const insertStyles = (styles: string[]): void => {
  if (typeof document === 'undefined') {
    return;
  }

  for (let i = 0; i < styles.length; i++) {
    if (!cache[styles[i]]) {
      cache[styles[i]] = true;
      insertRule(styles[i], {});
    }
  }
};
