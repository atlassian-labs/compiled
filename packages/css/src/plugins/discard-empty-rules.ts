import type { CustomAtRules, Visitor } from 'lightningcss';

/**
 * Discards any rule with an empty value
 */
export const discardEmptyRules = (): Visitor<CustomAtRules> => ({
  Declaration(declaration) {
    if (declaration.property === 'unparsed' && declaration.value.value.length === 1) {
      const tokenOrValue = declaration.value.value[0];
      if (
        tokenOrValue.type === 'token' &&
        ((tokenOrValue.value.type === 'ident' &&
          (tokenOrValue.value.value === 'undefined' || tokenOrValue.value.value === 'null')) ||
          tokenOrValue.value.type === 'white-space')
      ) {
        return [];
      }
    }

    return declaration;
  },
});
