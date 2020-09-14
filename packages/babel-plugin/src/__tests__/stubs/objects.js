import { secondary } from './simple';

export const colors = {
  primary: 'red',
};

export const style = {
  fontSize: 12,
};

const danger = 'blue';

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

const cantEvaluate = (() => 12)();

export const cantStaticallyEvaluate = {
  fontSize: cantEvaluate,
};

export const colorMixin = () => ({ color: 'red' });
