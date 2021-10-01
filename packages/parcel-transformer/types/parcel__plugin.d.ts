declare module '@parcel/plugin' {
  import type { Transformer as T } from '@parcel/types';

  export class Transformer<TConfig extends unknown> {
    constructor(opts: T<TConfig>);
  }
}
