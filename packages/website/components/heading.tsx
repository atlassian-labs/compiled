/** @jsx jsx */
import React from 'react';
import { jsx } from '@compiled/css-in-js';

interface HeadingProps {
  as: 'h900' | 'h800' | 'h700' | 'h600' | 'h500' | 'h400' | 'h300' | 'h200' | 'h100';
  children: string;
}

const headingMap = {
  h900: 'h1',
  h800: 'h2',
  h700: 'h3',
  h600: 'h4',
  h500: 'h5',
  h400: 'h6',
  h300: 'h6',
  h200: 'h6',
  h100: 'h6',
} as const;

export const Heading = ({ children, as }: HeadingProps) => {
  const As = headingMap[as];

  return (
    <As
      css={`
        font-family: 'Charlie Display';
        font-weight: 500;
        color: #253858;
        margin-bottom: 24px;

        h1& {
          font-size: 52px;
          line-height: 60px;
        }

        h2& {
          font-size: 36px;
          line-height: 44px;
        }

        h3& {
          font-weight: 500;
          font-size: 24px;
          line-height: 32px;
          letter-spacing: 0.3px;
        }

        h4& {
          font-size: 20px;
          line-height: 24px;
          letter-spacing: 0.3px;
        }

        h5& {
          font-weight: 700;
          font-size: 14px;
          line-height: 20px;
          text-transform: uppercase;
          letterspacing: 1px;
        }

        h6& {
          font-size: 12px;
          line-height: 18px;
          margin-bottom: 16px;
          text-transform: uppercase;
          letterspacing: 1px;
        }
      `}>
      {children}
    </As>
  );
};
