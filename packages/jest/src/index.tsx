import { MatchFilter } from './types';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveCompiledCss(properties: { [key: string]: string }, matchFilter?: MatchFilter): R;
      toHaveCompiledCss(property: string, value: string, matchFilter?: MatchFilter): R;
    }
  }
}

export { toHaveCompiledCss } from './matchers';
