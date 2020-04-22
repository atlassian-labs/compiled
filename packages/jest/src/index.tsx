declare global {
  namespace jest {
    type MatchConf = Partial<Record<'state' | 'media', string>>;
    interface Matchers<R> {
      toHaveCompiledCss(properties: { [key: string]: string }, matchFilter?: MatchConf): R;
      toHaveCompiledCss(property: string, value: string, matchFilter?: MatchConf): R;
    }
  }
}

export { toHaveCompiledCss } from './matchers';
