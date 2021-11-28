import { useState } from 'react';
import '@compiled/react';

export default {
  title: 'css prop/dynamic object',
};

export const DynamicCssProp = (): JSX.Element => {
  const [color, setColor] = useState('red');

  return (
    <div
      css={{
        padding: '20px',
        ':hover': {
          backgroundColor: 'purple',
        },
      }}>
      <div css={{ display: 'flex', fontSize: '20px', color }}>{color} text</div>

      <div
        css={{
          '> *': {
            margin: '10px',
          },
        }}>
        <button onClick={() => setColor('red')}>red</button>
        <button onClick={() => setColor('green')}>green</button>
        <button onClick={() => setColor('blue')}>blue</button>
      </div>

      <div
        css={`
          display: block;
          font-size: 20px;
        `}>
        black text
      </div>
    </div>
  );
};

const NestedColor = ({ color }: { color: string }) => (
  <div css={{ div: { color: 'blue' } }}>
    <div css={{ color: `${color} !important` }}>I SHOULD BE RED</div>
  </div>
);

export const ImportantChild = (): JSX.Element => <NestedColor color="red" />;

const FlushChild = ({ spacing }: { spacing: number }) => (
  <div
    css={{
      height: 200,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 200,
      backgroundColor: 'blue',
      textAlign: 'center',
      margin: `-${spacing * 2}px -${spacing * 3}px`,
    }}>
    SHOULD BE FLUSH AGAINST PARENT
  </div>
);

export const InterpolationsWithMinus = (): JSX.Element => (
  <div css={{ padding: '16px 24px', backgroundColor: 'red' }}>
    <FlushChild spacing={8} />
  </div>
);

const AnotherFlushChild = ({ spacing }: { spacing: number }) => (
  <div
    css={{
      height: 200,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 200,
      backgroundColor: 'blue',
      textAlign: 'center',
      margin: `0 -${spacing * 2}px -${spacing * 3}px`,
    }}>
    SHOULD BE FLUSH AGAINST PARENT
  </div>
);

export const InterpolationsWithZeroAndMinus = (): JSX.Element => (
  <div css={{ padding: '0 16px 24px', backgroundColor: 'red' }}>
    <AnotherFlushChild spacing={8} />
  </div>
);
