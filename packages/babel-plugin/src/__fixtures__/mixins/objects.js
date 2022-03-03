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
  background: colors.primary,
  color: danger,
  fontSize: 14,
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

export const colorMixin = () => ({ backgroundColor: secondary, color: colors.primary });

export const spacingMixin = {
  padding: {
    top: () => (() => 10)(),
  },
};

export const colorMixin2 = (bgColor) => ({ backgroundColor: bgColor, color: colors.primary });
