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
