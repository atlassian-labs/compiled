import { CSSProperties, ReactNode } from 'react';
import { createSetupError } from '../utils/error';

type CssObject<TProps> =
  | CSSProperties
  | Record<string, CSSProperties | ((props: TProps) => string | number) | string | number>;

type Interpoltation<TProps> = string | number | ((props: TProps) => string | number);

function styledFunction<TProps extends {}>(
  _: CssObject<TProps> | TemplateStringsArray,
  ...__: Interpoltation<TProps>[]
): React.ComponentType<TProps & { children?: ReactNode }> {
  throw createSetupError();
}

export const styled: Record<keyof JSX.IntrinsicElements, typeof styledFunction> = new Proxy(
  {},
  {
    get() {
      return styledFunction;
    },
  }
) as any;
