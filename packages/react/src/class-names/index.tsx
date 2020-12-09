import { ReactNode } from 'react';
import { createSetupError } from '../utils/error';
import { CssFunction, BasicTemplateInterpolations } from '../types';

export type Interpolations = (BasicTemplateInterpolations | CssFunction | CssFunction[])[];

export interface ClassNamesProps {
  children: (opts: {
    css: (css: CssFunction | CssFunction[], ...interpolations: Interpolations) => string;
    style: { [key: string]: string };
  }) => ReactNode;
}

export function ClassNames(_: ClassNamesProps): JSX.Element {
  throw createSetupError();
}
