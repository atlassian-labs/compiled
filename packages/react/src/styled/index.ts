import type { ComponentType } from 'react';

import type { CssType, CssFunction } from '../types';
import { createSetupError } from '../utils/error';

/**
 * Extra props added to the output Styled Component.
 */
export interface StyledProps {
  as?: keyof JSX.IntrinsicElements;
}

export type ObjectInterpolation<TProps> = CssType<TProps> | CssType<TProps>[];
export type TemplateStringsInterpolation<TProps> = CssFunction<TProps> | CssFunction<TProps>[];

export interface StyledComponent<ComponentProps> {
  // Allows either string or object (`` or ({}))
  // We disable the ban types rule here as we need to join the empty object default with other props
  // eslint-disable-next-line @typescript-eslint/ban-types
  <TProps = {}>(...css: ObjectInterpolation<TProps>[]): React.ComponentType<
    TProps & ComponentProps & StyledProps
  >;
  // eslint-disable-next-line @typescript-eslint/ban-types
  <TProps = {}>(
    template: TemplateStringsArray,
    ...interpolations: TemplateStringsInterpolation<TProps>[]
  ): React.ComponentType<TProps & ComponentProps & StyledProps>;
}

// This creates the DOM element types for `styled.tag`, e.g. `span`, `div`, `h1`, etc.
export type StyledComponentMap = {
  [Tag in keyof JSX.IntrinsicElements]: StyledComponent<JSX.IntrinsicElements[Tag]>;
};

export interface CreateStyledComponent extends StyledComponentMap {
  // Typing to enable consumers to compose components, e.g: `styled(Component)`
  <TInheritedProps>(Component: ComponentType<TInheritedProps>): StyledComponent<TInheritedProps>;
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
