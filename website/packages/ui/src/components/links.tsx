/** @jsxImportSource @compiled/react */
import { Link } from 'react-router-dom';

import { primary } from '../utils/colors';

import { Heading } from './heading';
import { VerticalStack } from './stack';

interface PageLink {
  to: string;
  children: string;
  section: string;
  hard?: boolean;
  direction: 'next' | 'previous';
}

export function PageLink({ to, hard, section, direction, children }: PageLink) {
  const A = hard ? 'a' : Link;
  const props = hard ? { href: to } : { to };
  const isNext = direction === 'next';

  return (
    <VerticalStack
      data-next={isNext}
      data-previous={!isNext}
      gap={1.5}
      css={{
        textAlign: isNext ? 'right' : 'left',
      }}>
      <Heading look="h500" as="div">
        {section}
      </Heading>

      <A
        css={{
          textDecoration: 'none',
        }}
        {...props}>
        <Heading
          as="span"
          look="h300"
          css={{
            color: primary,
            textTransform: 'capitalize',
          }}>
          {!isNext && (
            <span
              aria-hidden
              css={{ position: 'absolute', transform: 'translateX(-160%)' }}>
              ‹
            </span>
          )}

          {children}

          {isNext && (
            <span
              aria-hidden
              css={{ position: 'absolute', transform: 'translateX(80%)' }}>
              ›
            </span>
          )}
        </Heading>
      </A>
    </VerticalStack>
  );
}
