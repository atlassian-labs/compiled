/** @jsxImportSource @compiled/react */
import { primary, textLight } from '../utils/colors';

import { Text } from './text';

export function Lozenge({ children }: { children: string }): JSX.Element {
  return (
    <span
      css={{
        display: 'inline-block',
        backgroundColor: primary,
        color: textLight,
        padding: '4px 6px',
        borderRadius: 3,
        textTransform: 'uppercase',
        lineHeight: 0,
      }}>
      <Text weight="bold" variant="supplementary">
        {children}
      </Text>
    </span>
  );
}
