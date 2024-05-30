import { useEffect } from 'react';

export const PageTitle = ({ title }: { title?: string }) => {
  useEffect(() => {
    document.title = `${title || 'Docs'} - Compiled CSS-in-JS`;
  }, [title]);
  return null;
};
