declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveCompiledCss(properties: { [key: string]: string }): R;
      toHaveCompiledCss(property: string, value: string): R;
    }
  }
}

export { toHaveCompiledCss } from './matchers';
