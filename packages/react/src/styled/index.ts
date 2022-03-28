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

export type Interpolation<TProps extends unknown> =
  | BasicTemplateInterpolations
  | FunctionInterpolation<TProps>
  | CssObject<TProps>
  | CssObject<TProps>[];

export interface StyledComponent<ComponentProps extends unknown> {
  // ``
  <TProps extends unknown>(
    template: TemplateStringsArray,
    ...interpolations: Interpolation<TProps>[]
  ): React.ComponentType<TProps & ComponentProps & StyledProps>;
  // {}
  <TProps extends unknown>(...css: Interpolation<TProps>[]): React.ComponentType<
    TProps & ComponentProps & StyledProps
  >;
}

// This creates the DOM element types for `styled.tag`, e.g. `span`, `div`, `h1`, etc.
export type StyledComponentMap = {
  [Tag in keyof JSX.IntrinsicElements]: StyledComponent<JSX.IntrinsicElements[Tag]>;
};

export interface CreateStyledComponent extends StyledComponentMap {
  // Typing to enable consumers to compose components, e.g: `styled(Component)`
  <TInheritedProps extends unknown>(
    Component: ComponentType<TInheritedProps>
  ): StyledComponent<TInheritedProps>;
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
export const styled: CreateStyledComponent = new Proxy(
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
