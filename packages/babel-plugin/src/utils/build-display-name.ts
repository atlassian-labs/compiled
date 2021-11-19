import template from '@babel/template';
import type * as t from '@babel/types';

const displayNameTemplate = template(
  `
if (process.env.NODE_ENV !== 'production') {
  %%identifier%%.displayName = %%displayName%%;
}
`,
  { syntacticPlaceholders: true }
);

/**
 * Assigns a display name string to the identifier.
 *
 * @param identifier
 * @param displayName
 * @returns
 */
export const buildDisplayName = (identifier: string, displayName: string = identifier): t.Node => {
  return displayNameTemplate({
    identifier,
    displayName: `'${displayName}'`,
  }) as t.Node;
};
