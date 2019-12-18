import { CSSProperties } from 'react';
import { name as packageName } from '../../package.json';

export const IS_CSS_FREEDOM_COMPILED = false;

type CssObjectValue = CSSProperties[keyof CSSProperties];
type CssObject<TProps> =
  | CSSProperties
  | Record<keyof CSSProperties, CssObjectValue>
  | { [key: string]: ((props: TProps) => CssObjectValue) | CssObjectValue };

function styledFunction<TProps extends { [key: string]: string | number }>(
  strings: CssObject<TProps>,
  ...interpoltations: any[]
): React.ComponentType<TProps> {
  if (process.env.NODE_ENV !== 'production' && !IS_CSS_FREEDOM_COMPILED) {
    throw new Error(`${packageName}

You need to apply the typescript transformer to use this!
You can apply it from \`${packageName}/transformer\`.`);
  }

  return undefined as any;
}

export const styled: Record<keyof JSX.IntrinsicElements, typeof styledFunction> = {} as any;
