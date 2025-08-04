// eslint-disable-next-line import/no-extraneous-dependencies
import { css } from '@compiled/react';

import { secondary } from './simple';

export const colors = {
  primary: 'red',
};

export const style = {
  fontSize: 12,
};

const danger = 'blue';
export { danger };

export const styleInlining = {
  fontSize: 14,
  color: danger,
  background: colors.primary,
};

export const styleModuleInlining = {
  color: secondary,
};

export default {
  primary: 'blue',
};

const fontSize = (() => 12)();

export const fontMixin = {
  fontSize,
};

export const colorMixin = () => ({ color: colors.primary, backgroundColor: secondary });

export const spacingMixin = {
  padding: {
    top: () => (() => 10)(),
  },
};

export const colorMixin2 = (bgColor) => ({ color: colors.primary, backgroundColor: bgColor });

export const plainObjectMixin = {
  default: {
    color: 'black',
  },
  success: {
    color: 'green',
  },
  fail: {
    color: 'red',
  },
};

export const cssCallExpressionMixin = {
  default: css({
    color: 'black',
  }),
  success: css({
    color: 'green',
  }),
  fail: css({
    color: 'red',
  }),
};

export const cssPropertyNames = {
  level1: {
    level2: 'color',
  },
};
