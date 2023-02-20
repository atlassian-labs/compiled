/**
 * Compress class names based on `classNameCompressionMap`.
 * The compressed class name has a format of `_aaaa_a`, which is expected by `ax`.
 * `aaaa` is the atomic group and `a` is the compressed name.
 */
export const compressClassNamesForAx = (
  classNames: string[],
  classNameCompressionMap?: { [index: string]: string }
): string[] => {
  if (!classNameCompressionMap) return classNames;
  return classNames.map((className) => {
    const compressedClassName =
      classNameCompressionMap && classNameCompressionMap[className.slice(1)];
    return compressedClassName ? `_${className.slice(1, 5)}_${compressedClassName}` : className;
  });
};
