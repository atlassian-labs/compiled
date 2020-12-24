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

/**
 * Use `ClassNames` to have more control over a component that has styles not necessarily tied to an element,
 * enabling powerful patterns with render props.
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
 * https://compiledcssinjs.com/docs/class-names
 *
 * @param props
 */
export function ClassNames(_: ClassNamesProps): JSX.Element {
  throw createSetupError();
}
