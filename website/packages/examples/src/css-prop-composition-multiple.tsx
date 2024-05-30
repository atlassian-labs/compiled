/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';

const danger = css({
  color: 'red',
});

const base = css({
  color: 'hotpink',
  padding: '0.5rem 0',
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
});

export const CompositionMultiple = () => {
  return (
    <div>
      <div css={base}>This is hot pink.</div>
      <div css={[danger, base]}>This is also hot pink.</div>
      <div css={[base, danger]}>This is red!</div>
    </div>
  );
};
