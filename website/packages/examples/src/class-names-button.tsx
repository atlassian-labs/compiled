import { ClassNames } from '@compiled/react';

export const Button = ({
  children,
}: {
  children: (props: Record<string, unknown>) => JSX.Element;
}): JSX.Element => {
  return (
    <ClassNames>
      {({ css }) =>
        children({
          className: css({
            border: 'none',
            borderRadius: '3px',
            padding: '8px 10px',
            backgroundColor: '#6554C0',
            color: '#fff',
            fontWeight: 400,
            fontFamily: 'Arial',
            fontSize: '14px',

            '&:hover': {
              backgroundColor: '#8777D9',
            },

            '&:active': {
              backgroundColor: '#5243AA',
            },
          }),
        })
      }
    </ClassNames>
  );
};

<Button>{(props) => <button {...props}>Button</button>}</Button>;
