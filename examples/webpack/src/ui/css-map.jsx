import { css, cssMap } from '@compiled/react';

const base = css({
  backgroundColor: 'blue',
});

const styles = cssMap({
  danger: {
    color: 'red',
  },
  success: {
    color: 'green',
  },
});

export default ({ variant, children }) => <div css={[base, styles[variant]]}>{children}</div>;
