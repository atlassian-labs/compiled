import { colors } from '@compiled-private/module-a';

export const reexport = colors.primary;

export const objectReexport = {
  foo: colors.danger,
};

export { primary as default, secondary, default as reexportedDefault } from './simple';
