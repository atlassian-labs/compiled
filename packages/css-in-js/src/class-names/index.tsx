import { ReactNode } from 'react';
import { createSetupError } from '../utils/error';
import { CssFunction, TemplateInterpolations } from '../types';

export interface ClassNamesProps {
  children: (opts: {
    css: (css: CssFunction | CssFunction[], ...interpoltations: TemplateInterpolations[]) => string;
    style: { [key: string]: string };
  }) => ReactNode;
}

export function ClassNames(_: ClassNamesProps): JSX.Element {
  throw createSetupError();
}
