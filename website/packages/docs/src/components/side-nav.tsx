import { styled } from '@compiled/react';
import { VerticalStack, Heading, colors, Text } from '@compiled/website-ui';
import { cloneElement, Children } from 'react';
import { Link } from 'react-router-dom';

interface SectionProps {
  children: React.ReactNode;
  title: string;
}

export const Section = ({ children, title }: SectionProps): JSX.Element => {
  const id = `section--${title.toLowerCase().split(' ').join('-')}`;

  return (
    <VerticalStack gap={2} spacing={6}>
      <Heading id={id} as="div" look="h500">
        {title}
      </Heading>
      {Children.map(children, (child) =>
        cloneElement(child as JSX.Element, { 'aria-labelledby': id })
      )}
    </VerticalStack>
  );
};

const StyledLink = styled(Link)`
  user-select: none;
  color: currentColor;
  text-decoration: none;

  :hover,
  :focus {
    cursor: pointer;
    color: ${colors.primary};
  }

  :active {
    opacity: 0.8;
  }

  &[aria-current='page'] {
    color: ${colors.primary};
    position: relative;

    :before {
      content: '';
      border-left: 2px solid ${colors.primary};
      transform: translateX(-8px);
      position: absolute;
      top: 0;
      bottom: 0;
    }
  }
`;

export const LinkItem = ({
  children,
  href,
  ...props
}: {
  children: React.ReactNode;
  href: string;
}): JSX.Element => {
  return (
    <Text as="div" variant="aside">
      <StyledLink {...props} to={href}>
        {children}
      </StyledLink>
    </Text>
  );
};
