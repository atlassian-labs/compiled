import { ObjectLiteralCSS } from '../types';
import { name as packageName } from '../../package.json';

export const IS_CSS_FREEDOM_COMPILED = false;

function styledFunction(
  strings: TemplateStringsArray | ObjectLiteralCSS,
  ...interpoltations: any[]
): React.ComponentType {
  if (process.env.NODE_ENV !== 'production' && !IS_CSS_FREEDOM_COMPILED) {
    throw new Error(`${packageName}

You need to apply the typescript transformer to use this!
You can apply it from \`${packageName}/transformer\`.`);
  }

  return undefined as any;
}

export const styled: Record<keyof JSX.IntrinsicElements, typeof styledFunction> = {} as any;
