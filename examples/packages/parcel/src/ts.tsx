import '@compiled/react';
import { primary } from './module';

interface TSProps {
  color: string;
}

export default function TypeScriptHome({ color }: TSProps): JSX.Element {
  return (
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
}
