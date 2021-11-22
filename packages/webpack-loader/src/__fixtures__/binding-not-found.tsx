/** @jsx jsx */
import { jsx, styled } from '@compiled/react';
import React from 'react';

const height = '9rem';

const StyledHeader = styled.header<{
  color: string;
  variant: 'default' | 'invert';
}>`
  height: ${height};
  display: flex;
  align-items: center;
  padding: 0 3rem;
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
  max-width: 140rem;
  border-bottom: 1px solid
    ${(props) => (props.variant === 'default' ? 'rgba(135, 119, 217, 0.2)' : 'transparent')};
  color: ${(props) => props.color};
`;

export const HeaderSpacing = styled.div`
  height: ${height};
`;

interface HeaderProps {
  variant?: 'default' | 'invert';
  children: React.ReactNode;
}

export const Header = ({ children, variant = 'default', ...props }: HeaderProps): JSX.Element => {
  const color = variant === 'default' ? 'rgba(37, 56, 88, 0.9)' : 'rgba(255, 255, 255, 0.75)';

  return (
    <StyledHeader variant={variant} color={color} {...props}>
      <a href="/" css={{ textDecoration: 'none', color: 'currentColor' }}>
        Compiled
      </a>
      {children}
    </StyledHeader>
  );
};
