/** @jsxImportSource @compiled/react */
import type { ReactNode, CSSProperties } from 'react';

interface TextProps {
  children: ReactNode;
  variant?: 'reading' | 'aside' | 'supplementary';
  weight?: 'regular' | 'bold';
  as?: 'p' | 'span' | 'li' | 'div';
  className?: string;
  style?: CSSProperties;
}

export function Text({
  children,
  as: Component = 'span',
  weight = 'regular',
  variant = 'reading',
  className,
  style,
}: TextProps) {
  return (
    <Component
      className={className}
      style={style}
      data-variant={variant}
      css={[
        weight === 'regular' && `font-weight: 300;`,
        weight === 'bold' && `font-weight: 500;`,
        `
          font-family: 'Roboto', sans-serif;
          padding-top: 0.05px;
          padding-bottom: 0.05px;

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

          &[data-variant='reading'] {
            font-size: 20px;
            line-height: 30px;

            ::before {
              margin-top: -0.3834em;
            }

            ::after {
              margin-top: -0.3834em;
            }
          }

          &[data-variant='aside'] {
            font-size: 14px;
            line-height: 21px;

            ::before {
              margin-top: -0.3844em;
            }

            ::after {
              margin-bottom: -0.4118em;
            }
          }

          &[data-variant='supplementary'] {
            font-size: 12px;
            line-height: 18px;

            ::before {
              margin-top: -0.385em;
            }

            ::after {
              margin-bottom: -0.4124em;
            }
          }
        `,
      ]}>
      {children}
    </Component>
  );
}
