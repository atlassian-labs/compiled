import type { ReactNode, CSSProperties } from 'react';

import type { BasicTemplateInterpolations, CssFunction } from '../types';
import { createSetupError } from '../utils/error';

export type Interpolations = (BasicTemplateInterpolations | CssFunction | CssFunction[])[];

export interface ClassNamesProps {
  children: (opts: {
    css: (css: CssFunction | CssFunction[], ...interpolations: Interpolations) => string;
    style: CSSProperties;
  }) => ReactNode;
}

/**
 * ## Class names
 *
 * Use a component where styles are not necessarily used on a JSX element.
 * For further details [read the documentation](https://compiledcssinjs.com/docs/api-class-names).
 *
 * ### Style with objects
 *
 * @example
 * ```
 * <ClassNames>
 *   {({ css, style }) => children({ className: css({ fontSize: 12 }) })}
 * </ClassNames>
 * ```
 *
 * ### Style with template literals
 *
 * @example
 * ```
 * <ClassNames>
 *   {({ css, style }) => children({ className: css`font-size: 12px;` })}
 * </ClassNames>
 * ```
 *
 * ### Compose styles with arrays
 *
 * @example
 * ```
 * <ClassNames>
 *   {({ css, style }) =>
 *    children({ className: css([{ fontSize: 12 }, css`font-size: 12px`]) })}
 * </ClassNames>
 * ```
 */
export function ClassNames({ children }: ClassNamesProps): JSX.Element;

export function ClassNames(_props: ClassNamesProps): JSX.Element {
  throw createSetupError();
}
