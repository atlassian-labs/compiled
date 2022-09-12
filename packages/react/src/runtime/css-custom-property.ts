/**
 * Returns a CSS custom property value with an optional suffix & prefix.
 * Prefix will only be added if there is a suffix.
 * If the value is undefined a fallback value will be returned to prevent children inheriting parent values.
 *
 * @param value
 * @param suffix
 * @param prefix
 */
export default function cssCustomPropertyValue(
  value: string | number | null | undefined,
  suffix?: string | undefined | null,
  prefix?: string | undefined | null
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

  // Currently React trims these values so we can't use a space " " to block the value.
  // Instead we use a CSS variable that doesn't exist which falls back to " ".
  // Bug raised here: https://github.com/facebook/react/issues/20497
  return 'var(--c-, )';
}
