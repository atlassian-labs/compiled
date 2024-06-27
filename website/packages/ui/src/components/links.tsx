/** @jsxImportSource @compiled/react */
import type { ReactNode } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
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

function A({ isHard, children, to }: { isHard: boolean; children: ReactNode; to: string }) {
  const styles = {
    textDecoration: 'none',
  };
  if (isHard) {
    return (
      <a css={styles} href={to}>
        {children}
      </a>
    );
  }
  return (
    <Link css={styles} to={to}>
      {children}
    </Link>
  );
}

export function PageLink({ to, hard, section, direction, children }: PageLink): JSX.Element {
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

      <A isHard={hard} to={to}>
        <Heading
          as="span"
          look="h300"
          css={{
            color: primary,
            textTransform: 'capitalize',
          }}>
          {!isNext && (
            <span aria-hidden css={{ position: 'absolute', transform: 'translateX(-160%)' }}>
              ‹
            </span>
          )}

          {children}

          {isNext && (
            <span aria-hidden css={{ position: 'absolute', transform: 'translateX(80%)' }}>
              ›
            </span>
          )}
        </Heading>
      </A>
    </VerticalStack>
  );
}
