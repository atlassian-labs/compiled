import { useLayoutEffect } from 'react';

export const ScrollTop = (): null => {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return null;
};
