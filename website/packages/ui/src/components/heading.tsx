/** @jsxImportSource @compiled/react */
import type { ReactNode, DetailedHTMLProps, HTMLAttributes } from 'react';

interface HeadingProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement> {
  look: 'h500' | 'h400' | 'h300' | 'h200' | 'h100';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'span' | 'div';
  children: ReactNode;
}

const headingMap = {
  h100: 'h1',
  h200: 'h2',
  h300: 'h3',
  h400: 'h4',
  h500: 'h5',
} as const;

export const Heading = ({ children, style, ...props }: HeadingProps): JSX.Element => {
  const As = props.as || headingMap[props.look];

  return (
    <As
      data-look={props.look}
      className={props.className}
      style={style}
      css={`
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
          'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        font-weight: 500;
        margin: 0;
        word-break: break-word;

        ::before {
          content: '';
          display: block;
          height: 0;
        }

        ::after {
          content: '';
          display: block;
          height: 0;
        }

        [data-look='h100']& {
          font-size: 48px;
          line-height: 56px;
          padding: 0.05px 0;

          ::before {
            margin-top: -0.2584em;
          }

          ::after {
            margin-bottom: -0.1964em;
          }

          @media only screen and (min-width: 900px) {
            font-size: 52px;
            line-height: 60px;
            padding: 0.05px 0;

            ::before {
              margin-top: -0.252em;
            }

            ::after {
              margin-bottom: -0.1899em;
            }
          }
        }

        [data-look='h200']& {
          font-size: 5rem;
          padding: 0.05px 0;

          ::before {
            margin-top: -0.2866em;
          }

          ::after {
            margin-bottom: -0.2246em;
          }
        }

        [data-look='h300']& {
          font-size: 3.5rem;
          padding: 0.05px 0;
          letter-spacing: 0.3px;

          ::before {
            margin-top: -0.3428em;
          }

          ::after {
            margin-bottom: -0.2808em;
          }
        }

        [data-look='h600']& {
          font-size: 2.75rem;
          padding: 0.05px 0;
          letter-spacing: 0.3px;

          ::before {
            margin-top: -0.2766em;
          }

          ::after {
            margin-bottom: -0.2146em;
          }
        }

        [data-look='h400']& {
          font-size: 2.5rem;
          padding: 0.05px 0;
          letter-spacing: 0.75px;
          color: #7a869a;

          ::before {
            margin-top: -0.3919em;
          }

          ::after {
            margin-bottom: -0.3299em;
          }
        }

        [data-look='h500']& {
          font-size: 1.5rem;
          padding: 0.05px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #7a869a;

          ::before {
            margin-top: -0.4282em;
          }

          ::after {
            margin-bottom: -0.3662em;
          }
        }
      `}>
      {children}
    </As>
  );
};
