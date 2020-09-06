import { primary } from './simple';

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
  color: primary,
};

export default {
  primary: 'blue',
};
