import { useEffect } from 'react';

export const PageTitle = ({ title }: { title?: string }): null => {
  useEffect(() => {
    document.title = `${title || 'Docs'} - Compiled CSS-in-JS`;
  }, [title]);
  return null;
};
