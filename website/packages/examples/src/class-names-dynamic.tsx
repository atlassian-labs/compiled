import { ClassNames } from '@compiled/react';

type EmphasisTextProps = {
  primary: string;
  children: React.ReactNode;
};

export const EmphasisText = (props: EmphasisTextProps): JSX.Element => (
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
