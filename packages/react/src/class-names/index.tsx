import type { ReactNode } from 'react';
import { createSetupError } from '../utils/error';
import type { CssFunction, BasicTemplateInterpolations } from '../types';

export type Interpolations = (BasicTemplateInterpolations | CssFunction | CssFunction[])[];

export interface ClassNamesProps {
  children: (opts: {
    css: (css: CssFunction | CssFunction[], ...interpolations: Interpolations) => string;
    style: { [key: string]: string };
  }) => ReactNode;
}

/**
 * Use a component where styles are not necessarily tied to an element.
 *
 * ```
 * // Object CSS
 * <ClassNames>
 *   {({ css, style }) => children({ className: css({ fontSize: 12 }) })}
 * </ClassNames>
 *
 * // Template literal CSS
 * <ClassNames>
 *   {({ css, style }) => children({ className: css`font-size: 12px;` })}
 * </ClassNames>
 *
 * // Array CSS
 * <ClassNames>
 *   {({ css, style }) =>
 *    children({ className: css([{ fontSize: 12 }, `font-size: 12px`]) })}
 * </ClassNames>
 * ```
 *
 * For more help, read the docs:
 * https://compiledcssinjs.com/docs/api-class-names
 *
 * @param props
 */
export function ClassNames(_: ClassNamesProps): JSX.Element {
  throw createSetupError();
}
