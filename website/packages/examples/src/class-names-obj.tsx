import { ClassNames } from '@compiled/react';

type EmphasisTextProps = {
  children: React.ReactNode;
};

export const EmphasisText = (props: EmphasisTextProps): JSX.Element => (
  <ClassNames>
    {({ css }) => (
      <span
        className={css({
          color: '#00b8d9',
          textTransform: 'uppercase',
          fontWeight: 700,
        })}>
        {props.children}
      </span>
    )}
  </ClassNames>
);
