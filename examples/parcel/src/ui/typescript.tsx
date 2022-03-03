/** @jsxImportSource @compiled/react */
import { primary } from '../constants';

interface TypeScriptProps {
  color: string;
}

export const TypeScript = ({ color }: TypeScriptProps): JSX.Element => (
  <div
    css={{
      border: `2px solid ${primary}`,
      borderRadius: 3,
      color,
      display: 'inline-block',
      padding: 8,
      textTransform: 'uppercase',
    }}>
    hello from typescript file
  </div>
);
