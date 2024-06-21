/** @jsxImportSource @compiled/react */
import { styled } from '@compiled/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { VerticalStack, Heading, CodeBlock, colors, Text } from '@compiled/website-ui';
import type { MDXProviderComponentsProp } from '@mdx-js/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Link } from 'react-router-dom';

import { Anchor } from './anchor';

const Hr = styled.hr`
  color: rgba(0, 0, 0, 0.1);
  margin: 6rem 0;
`;

const Quote = styled.blockquote`
  padding: 3rem;
  margin: 4rem -3rem;
  border-left: 4px solid ${colors.primary};
  background-color: #8777d926;
  opacity: 0.8;

  p {
    margin: 0;
  }
`;

const Code = styled.code`
  font-size: 0.9em;
  margin-top: 20px;
  color: currentColor;
  font-weight: 400;
  background-color: rgba(117, 63, 131, 0.07);
  border-radius: 5px;
  margin: 0;
  padding: 0.2rem 0.325rem;
  font-family: 'SFMono-Medium', 'SF Mono', 'Segoe UI Mono', 'Roboto Mono', 'Ubuntu Mono', Menlo,
    Consolas, Courier, monospace;
`;

const P = styled.p`
  margin: 4rem 0;
`;

export const mdxComponents: MDXProviderComponentsProp = {
  h1: ({ children }) => (
    <Heading look="h100">
      <Anchor>{children}</Anchor>
    </Heading>
  ),
  h2: ({ children }) => (
    <Heading css={{ marginTop: 68 }} look="h200">
      <Anchor>{children}</Anchor>
    </Heading>
  ),
  h3: ({ children }) => (
    <Heading css={{ marginTop: 60 }} look="h300">
      <Anchor>{children} </Anchor>
    </Heading>
  ),
  h4: ({ children }) => (
    <Heading css={{ marginTop: 52 }} look="h400">
      <Anchor>{children}</Anchor>
    </Heading>
  ),
  h5: ({ children }) => (
    <Heading css={{ marginTop: 44 }} look="h500">
      <Anchor>{children} </Anchor>
    </Heading>
  ),
  p: ({ children }) => (
    <P>
      <Text>{children}</Text>
    </P>
  ),
  pre: ({ children }) => children,
  code: ({ children, className }) => (
    <VerticalStack spacing={2}>
      <CodeBlock language={className ? className.split('-')[1] : undefined}>{children}</CodeBlock>
    </VerticalStack>
  ),
  hr: () => <Hr />,
  inlineCode: ({ children }) => <Code>{children}</Code>,
  a: ({ href, children, ...props }) =>
    href.startsWith('http') || href.startsWith('./') || href.startsWith('#') ? (
      <a
        href={href}
        css={{
          color: colors.primary,
          textDecoration: 'none',
          ':hover': { textDecoration: 'underline' },
        }}
        target={href.startsWith('#') ? undefined : '_blank'}
        rel="noopener noreferrer"
        {...props}>
        {children}
      </a>
    ) : (
      <Link
        to={href}
        css={{
          color: colors.primary,
          textDecoration: 'none',
          ':hover': { textDecoration: 'underline' },
        }}
        {...props}>
        {children}
      </Link>
    ),
  blockquote: (props) => <Quote {...props} />,
  strong: (props) => <strong css={{ fontWeight: 500 }} {...props} />,
  ol: (props) => <VerticalStack as="ol" spacing={4} gap={2} {...props} />,
  ul: (props) => <VerticalStack as="ul" spacing={4} gap={2} {...props} />,
  li: (props) => <Text as="li" {...props} />,
  td: (props) => (
    <td>
      <Text as="td" {...props} />
    </td>
  ),
  th: (props) => (
    <th>
      <Text as="th" weight="bold" {...props} />
    </th>
  ),
  table: (props) => <table {...props} css={{ marginTop: '4rem' }} />,
};
