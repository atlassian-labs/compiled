import { CSSProperties, ReactNode } from 'react';
import { name as packageName } from '../../package.json';

export const IS_CSS_FREEDOM_COMPILED = false;

type CssObject<TProps> =
  | CSSProperties
  | Record<string, CSSProperties | ((props: TProps) => string | number) | string | number>;

function styledFunction<TProps extends {}>(
  strings: CssObject<TProps>,
  ...interpoltations: any[]
): React.ComponentType<TProps & { children?: ReactNode }> {
  if (process.env.NODE_ENV !== 'production' && !IS_CSS_FREEDOM_COMPILED) {
    throw new Error(`${packageName}

You need to apply the typescript transformer to use this!
You can apply it from \`${packageName}/transformer\`.`);
  }

  return undefined as any;
}

export const styled: Record<keyof JSX.IntrinsicElements, typeof styledFunction> = {} as any;
