import type { JSX } from 'react';

declare module '*.mdx' {
  const Component: () => JSX.Element;
  export default Component;
}
