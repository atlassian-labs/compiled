import type { CSSProps, CssObject } from '../types';
import { createSetupError } from '../utils/error';

export default function xcss<TProps = unknown>(
  _styles: CssObject<TProps>
): Readonly<CSSProps<TProps>> {
  throw createSetupError();
}
