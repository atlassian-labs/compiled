import { type ShorthandProperties, shorthandFor } from '@compiled/utils';

// TODO: make more complete list of CSS properties
const CSS_PROPERTIES: string[] = [
  ...Object.keys(shorthandFor),
  ...Object.values(shorthandFor)
    .flat()
    .filter((value): value is string => typeof value === 'string'),
  'color',
];

export const errorIfInvalidProperties = (properties: string[]): void => {
  // TODO: can we make this not O(n^2) ???
  for (const property of properties) {
    // Forbid invalid CSS properties
    if (!CSS_PROPERTIES.includes(property)) {
      // TODO: can we give more debugging info for the developer?
      //       like the name of the component, the file the error was from...
      throw new Error(`Detected invalid CSS property ${property}`);
    }

    // Forbid mixing shorthand and longhand properties
    for (const potentialLonghand of properties) {
      const longhands = shorthandFor[property as ShorthandProperties];

      // TODO: can we give more debugging info for the developer?
      //       like the name of the component, the file the error was from...
      if (Array.isArray(longhands) && longhands.includes(potentialLonghand)) {
        throw new Error(
          `Detected shorthand property and longhand property were mixed: ${property} and ${potentialLonghand}.`
        );
      }
    }
  }
};
