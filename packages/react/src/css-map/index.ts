import type { CSSProps, CssObject } from '../types';
import { createSetupError } from '../utils/error';

export default function cssMap<T extends string, TProps = unknown>(
  _styles: Record<T, CssObject<TProps> | CssObject<TProps>[]>
): Record<T, CSSProps<TProps>> {
  throw createSetupError();
}
