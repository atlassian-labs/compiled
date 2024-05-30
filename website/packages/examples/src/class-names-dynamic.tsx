import { ClassNames } from '@compiled/react';

export const EmphasisText = (props) => (
  <ClassNames>
    {({ css, style }) => (
      <span
        style={style}
        // ^--- make sure to set style prop
        className={css({
          color: props.primary ? '#00B8D9' : '#36B37E',
          fontWeight: 600,
        })}>
        {props.children}
      </span>
    )}
  </ClassNames>
);
