export default function interpolation(
  value: string | number | number,
  suffix: string | undefined,
  prefix: string | undefined
): string | number {
  if (value != undefined) {
    if (suffix) {
      if (prefix) {
        return prefix + value + suffix;
      }

      return value + suffix;
    }

    return value;
  }

  // Currently React trims these values so we can't use this to block children from recieving CSS variables.
  // Bug raised here: https://github.com/facebook/react/issues/20497
  return ' ';
}
