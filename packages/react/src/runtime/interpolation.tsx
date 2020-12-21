export default function interpolation(
  value: string | number | number,
  suffix: string | undefined,
  prefix: string | undefined
): string | number {
  if (value) {
    if (suffix) {
      if (prefix) {
        return prefix + value + suffix;
      }

      return value + suffix;
    }

    return value;
  }

  return '/* */';
}
