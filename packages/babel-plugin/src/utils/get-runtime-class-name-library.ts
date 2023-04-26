import type { Metadata } from '../types';

// If classNameCompressionMap is provided, import and use `ac`, otherwise use `ax`.
// Although `ac` does what `ax` does plus handling compressed class names, `ax` is more performant than `ac`.
// Therefore, we use `ax` by default unless classNameCompressionMap is provided.
export const getRuntimeClassNameLibrary = (meta: Metadata): string => {
  return meta.state.opts.classNameCompressionMap ? 'ac' : 'ax';
};
