import { useLayoutEffect } from 'react';

export const ScrollTop = () => {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return null;
};
