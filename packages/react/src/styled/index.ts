import type { ComponentType } from 'react';

import type { BasicTemplateInterpolations, CssFunction, FunctionInterpolation } from '../types';
import { createSetupError } from '../utils/error';

/**
 * Typing for the CSS object.
 */
export type CssObject<TProps> = CssFunction<FunctionInterpolation<TProps>>;

/**
 * Extra props added to the output Styled Component.
 */
export interface StyledProps {
  as?: keyof JSX.IntrinsicElements;
}

export type Interpolations<TProps extends unknown> = (
  | BasicTemplateInterpolations
  | FunctionInterpolation<TProps>
  | CssObject<TProps>
  | CssObject<TProps>[]
)[];

/**
 * This allows us to take the generic `TTag` (that will be a valid `DOM` tag) and then use it to
 * define correct props based on it from `JSX.IntrinsicElements`, while also injecting our own
 * props from `StyledProps`.
 */
export interface StyledFunctionFromTag<TTag extends keyof JSX.IntrinsicElements> {
  <TProps extends unknown>(
    // Allows either string or object (`` or ({}))
    css: CssObject<TProps> | CssObject<TProps>[],
    ...interpolations: Interpolations<TProps>
  ): React.ComponentType<TProps & JSX.IntrinsicElements[TTag] & StyledProps>;
}

export interface StyledFunctionFromComponent<TInheritedProps extends unknown> {
  <TProps extends unknown>(
    // Allows either string or object (`` or ({}))
    css: CssObject<TProps> | TemplateStringsArray,
    ...interpolations: Interpolations<TProps>
  ): React.ComponentType<TProps & StyledProps & TInheritedProps>;
}

export type StyledComponentMap = {
  // This creates the DOM element types for `styled.blah`, e.g. `span`, `div`, `h1`, etc.
  [Tag in keyof JSX.IntrinsicElements]: StyledFunctionFromTag<Tag>;
};

export interface StyledComponentInstantiator extends StyledComponentMap {
  /**
   * Typing to enable consumers to compose components, e.g: `styled(Component)`
   */
  <TInheritedProps extends unknown>(
    Component: ComponentType<TInheritedProps>
  ): StyledFunctionFromComponent<TInheritedProps>;
}

/**
 * ## Styled component
 *
 * Create a component that styles a JSX element which comes with built-in behavior such as `ref` and `as` prop support.
 * For further details [read the documentation](https://compiledcssinjs.com/docs/api-styled).
 *
 * ### Style with objects
 *
 * @example
 * ```
 * styled.div({
 *   fontSize: 12,
 * });
 * ```
 *
 * ### Style with template literals
 *
 * @example
 * ```
 * styled.div`
 *   font-size: 12px
 * `;
 * ```
 *
 * ### Compose styles with arrays
 *
 * @example
 * ```
 * import { css } from '@compiled/react';
 *
 * styled.div([
 *   { fontSize: 12 },
 *   css`font-size: 12px;`
 * ]);
 *
 * styled.div(
 *   { fontSize: 12 },
 *   css`font-size: 12px`
 * );
 * ```
 */
export const styled: StyledComponentInstantiator = new Proxy(
  {},
  {
    get() {
      return () => {
        // Blow up if the transformer isn't turned on.
        // This code won't ever be executed when setup correctly.
        throw createSetupError();
      };
    },
  }
) as any;
