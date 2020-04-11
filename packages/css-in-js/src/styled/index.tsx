import { CSSProperties } from 'react';
import { createSetupError } from '../utils/error';

export type CssObject<TProps> =
  | CSSProperties
  | Record<string, CSSProperties | ((props: TProps) => string | number) | string | number>;

export type Interpoltation<TProps> = string | number | ((props: TProps) => string | number);

export interface StyledProps {
  as?: keyof JSX.IntrinsicElements;
}

export interface StyledFunction<TTag extends keyof JSX.IntrinsicElements> {
  <TProps extends {}>(
    css: CssObject<TProps> | TemplateStringsArray,
    ...interpoltations: Interpoltation<TProps>[]
  ): React.ComponentType<TProps & JSX.IntrinsicElements[TTag] & StyledProps>;
}

export type StyledComponentMap = {
  [Tag in keyof JSX.IntrinsicElements]: StyledFunction<Tag>;
};

export const styled: StyledComponentMap = new Proxy(
  {},
  {
    get() {
      return () => {
        throw createSetupError();
      };
    },
  }
) as any;
