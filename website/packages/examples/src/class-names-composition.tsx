/** @jsxImportSource @compiled/react */
import { ClassNames } from '@compiled/react';
import { ax } from '@compiled/react/runtime';

type CustomColorTextProps = {
  color: string;
  children: React.ReactNode;
};

const EmphasisText = ({
  className,
  children,
  style,
}: {
  className?: string;
  children?: React.ReactNode;
  style?: any;
}) => (
  <ClassNames>
    {({ css }) => (
      <span
        style={style}
        className={ax([
          css({
            color: '#00b8d9',
            textTransform: 'uppercase',
            fontWeight: 700,
          }),
          className,
        ])}>
        {children}
      </span>
    )}
  </ClassNames>
);

export const CustomColorText = (props: CustomColorTextProps): JSX.Element => (
  <EmphasisText css={{ color: props.color }}>{props.children}</EmphasisText>
);
