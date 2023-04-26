/**
 * Compress class names based on `classNameCompressionMap`.
 * The compressed class name has a format of `_aaaa_a`, which is expected by `ac`.
 * `aaaa` is the atomic group and `a` is the compressed name.
 */
export const compressClassNamesForRuntime = (
  classNames: string[],
  classNameCompressionMap?: { [index: string]: string }
): string[] => {
  // If no classNameCompressionMap, return original class names.
  if (!classNameCompressionMap) return classNames;
  return classNames.map((className) => {
    const compressedClassName =
      classNameCompressionMap && classNameCompressionMap[className.slice(1)];
    return compressedClassName ? `_${className.slice(1, 5)}_${compressedClassName}` : className;
  });
};
