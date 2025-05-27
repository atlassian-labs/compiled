/** @jsxImportSource @compiled/react */
import { primary } from '../constants';

interface TypeScriptProps {
  color: string;
}

export const TypeScript = ({ color }: TypeScriptProps): JSX.Element => (
  <div
    css={{
      display: 'inline-block',
      padding: 8,
      border: `2px solid ${primary}`,
      borderRadius: 3,
      color,
      textTransform: 'uppercase',
    }}>
    hello from typescript file
  </div>
);
