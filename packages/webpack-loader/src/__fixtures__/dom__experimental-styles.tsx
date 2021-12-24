import { cstyle } from '@compiled/dom__experimental';
import React from 'react';

const styles = cstyle.create({
  red: {
    color: 'red',
  },
  blue: {
    color: 'blue',
  },
});

export function MyComponent(): JSX.Element {
  return <div className={cstyle([styles.red, styles.blue])} />;
}
