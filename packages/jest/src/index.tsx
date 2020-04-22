declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveCompiledCss(
        properties: { [key: string]: string },
        matchFilter?: Partial<Record<'state' | 'media', string>>
      ): R;
      toHaveCompiledCss(
        property: string,
        value: string,
        matchFilter?: Partial<Record<'state' | 'media', string>>
      ): R;
    }
  }
}

export { toHaveCompiledCss } from './matchers';
