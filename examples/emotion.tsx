/** @jsx jsx */
import { jsx } from '@emotion/core';

export default {
  title: 'benchmarks | emotion',
};

export const Static = () => (
  <span
    css={{
      backgroundColor: 'rgb(223, 225, 230)',
      borderRadius: 3,
      boxSizing: 'border-box',
      color: 'rgb(66, 82, 110)',
      display: 'inline-block',
      fontSize: '11px',
      fontWeight: 700,
      lineHeight: 1,
      maxWidth: '100%',
      padding: '2px 0 3px 0',
      textTransform: 'uppercase',
      verticalAlign: 'baseline',
    }}>
    <span
      css={{
        display: 'inline-block',
        verticalAlign: 'top',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        padding: `0 4px`,
        maxWidth: 100,
        width: '100%',
      }}>
      Lozenge
    </span>
  </span>
);

const Lozenge = (props: { bg: string; color: string }) => (
  <span
    css={{
      backgroundColor: props.bg,
      borderRadius: 3,
      boxSizing: 'border-box',
      color: props.color,
      display: 'inline-block',
      fontSize: '11px',
      fontWeight: 700,
      lineHeight: 1,
      maxWidth: '100%',
      padding: '2px 0 3px 0',
      textTransform: 'uppercase',
      verticalAlign: 'baseline',
    }}>
    <span
      css={{
        display: 'inline-block',
        verticalAlign: 'top',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        padding: `0 4px`,
        maxWidth: 100,
        width: '100%',
      }}>
      Lozenge
    </span>
  </span>
);

export const Dynamic = () => <Lozenge bg="rgb(0, 135, 90)" color="rgb(255, 255, 255)" />;
