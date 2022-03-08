// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { MatchFilter } from './types';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveCompiledCss(properties: { [key: string]: string }, matchFilter?: MatchFilter): R;
      toHaveCompiledCss(property: string, value: string, matchFilter?: MatchFilter): R;
    }
  }
}

export { toHaveCompiledCss } from './matchers';
