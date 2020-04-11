import { CSSProperties, ComponentType } from 'react';
import { createSetupError } from '../utils/error';

/**
 * Typing for the CSS object.
 */
export type CssObject<TProps> =
  | CSSProperties
  | string
  | Record<string, CSSProperties | ((props: TProps) => string | number) | string | number>;

/**
 * Typing for the interpolations.
 */
export type Interpolations<TProps> = string | number | ((props: TProps) => string | number);

/**
 * Extra props added to the output Styled Component.
 */
export interface StyledProps {
  as?: keyof JSX.IntrinsicElements;
}

/**
 * This allows us to take the generic `TTag` (that will be a valid `DOM` tag) and then use it to
 * define correct props based on it from `JSX.IntrinsicElements`, while also injecting our own
 * props from `StyledProps`.
 */
export interface StyledFunctionFromTag<TTag extends keyof JSX.IntrinsicElements> {
  <TProps extends {}>(
    // Allows either string or object (`` or ({}))
    css: CssObject<TProps> | CssObject<TProps>[] | TemplateStringsArray,
    ...interpoltations: Interpolations<TProps>[]
  ): React.ComponentType<TProps & JSX.IntrinsicElements[TTag] & StyledProps>;
}

export interface StyledFunctionFromComponent<TInheritedProps extends {}> {
  <TProps extends {}>(
    // Allows either string or object (`` or ({}))
    css: CssObject<TProps> | TemplateStringsArray,
    ...interpoltations: Interpolations<TProps>[]
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
  <TInheritedProps extends {}>(
    Component: ComponentType<TInheritedProps>
  ): StyledFunctionFromComponent<TInheritedProps>;
}

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
