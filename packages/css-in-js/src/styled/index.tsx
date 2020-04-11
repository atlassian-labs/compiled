import { CSSProperties } from 'react';
import { createSetupError } from '../utils/error';

type CssObject<TProps> =
  | CSSProperties
  | Record<string, CSSProperties | ((props: TProps) => string | number) | string | number>;

type Interpoltation<TProps> = string | number | ((props: TProps) => string | number);

interface StyledProps {
  as?: keyof JSX.IntrinsicElements;
}

interface StyledFunction<TTag extends keyof JSX.IntrinsicElements> {
  <TProps extends {}>(
    css: CssObject<TProps> | TemplateStringsArray,
    ...interpoltations: Interpoltation<TProps>[]
  ): React.ComponentType<TProps & JSX.IntrinsicElements[TTag] & StyledProps>;
}

type StyledComponentMap = {
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
