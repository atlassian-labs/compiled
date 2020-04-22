declare global {
  type MatchFilter = Partial<Record<'state' | 'media', string>>;
  namespace jest {
    interface Matchers<R> {
      toHaveCompiledCss(properties: { [key: string]: string }, matchFilter?: MatchFilter): R;
      toHaveCompiledCss(property: string, value: string, matchFilter?: MatchFilter): R;
    }
  }
}

export { toHaveCompiledCss } from './matchers';
