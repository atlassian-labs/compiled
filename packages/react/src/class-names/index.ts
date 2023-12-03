import type { ReactNode, CSSProperties } from 'react';

import type { CssType, CssFunction } from '../types';
import { createSetupError } from '../utils/error';

export type ObjectInterpolation<TProps> = CssType<TProps> | CssType<TProps>[];
export type TemplateStringsInterpolation<TProps> = CssFunction<TProps> | CssFunction<TProps>[];

interface CssSignature<TProps> {
  (...interpolations: ObjectInterpolation<TProps>[]): string;
  (
    template: TemplateStringsArray,
    ...interpolations: TemplateStringsInterpolation<TProps>[]
  ): string;
}

export interface ClassNamesProps<TProps> {
  children: (opts: { css: CssSignature<TProps>; style: CSSProperties }) => ReactNode;
}

/**
 * ## Class Names
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
export function ClassNames<TProps = void>({ children }: ClassNamesProps<TProps>): JSX.Element;

export function ClassNames<TProps = void>(_props: ClassNamesProps<TProps>): JSX.Element {
  throw createSetupError();
}
