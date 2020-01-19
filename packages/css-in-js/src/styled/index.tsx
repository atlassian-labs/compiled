import { CSSProperties, ReactNode } from 'react';

type CssObject<TProps> =
  | CSSProperties
  | Record<string, CSSProperties | ((props: TProps) => string | number) | string | number>;

type Interpoltation<TProps> = string | number | ((props: TProps) => string | number);

function styledFunction<TProps extends {}>(
  _: CssObject<TProps> | TemplateStringsArray,
  ...__: Interpoltation<TProps>[]
): React.ComponentType<TProps & { children?: ReactNode }> {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`@compiled/css-in-js

You need to apply the typescript transformer to use this!
You can apply it from \`@compiled/css-in-js/ts-transformer\`.`);
  }

  return undefined as any;
}

export const styled: Record<keyof JSX.IntrinsicElements, typeof styledFunction> = new Proxy(
  {},
  {
    get() {
      return styledFunction;
    },
  }
) as any;
