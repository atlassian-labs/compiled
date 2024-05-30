/** @jsxImportSource @compiled/react */
import { ClassNames } from '@compiled/react';
import { ax } from '@compiled/react/runtime';

const EmphasisText = ({ className, children, style }: { className?: string; children?: any; style?: any }) => (
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

export const CustomColorText = (props) => (
  <EmphasisText css={{ color: props.color }}>{props.children}</EmphasisText>
);
