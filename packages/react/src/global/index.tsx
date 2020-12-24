import { CssFunction } from '../types';
import { createSetupError } from '../utils/error';

interface GlobalProps {
  style: CssFunction | CssFunction[];
}

export function Global(_: GlobalProps): JSX.Element {
  throw createSetupError();
}
