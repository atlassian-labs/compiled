import { css, cssMap } from '@compiled/react';

const styles = cssMap({
  danger: {
    color: 'red',
  },
  success: {
    color: 'green',
  },
});

export default ({ variant, children }) => <div css={css(styles[variant])}>{children}</div>;
