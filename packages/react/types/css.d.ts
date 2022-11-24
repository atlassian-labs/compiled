import type { CssFunction } from '@compiled/react';

declare module 'react' {
  interface HTMLAttributes<T> {
    css?: CssFunction;
  }
}
