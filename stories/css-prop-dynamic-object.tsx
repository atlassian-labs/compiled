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
        ':hover': {
          backgroundColor: 'purple',
        },
        padding: '20px',
      }}>
      <div css={{ color, display: 'flex', fontSize: '20px' }}>{color} text</div>

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
      alignItems: 'center',
      backgroundColor: 'blue',
      color: 'white',
      display: 'flex',
      height: 200,
      justifyContent: 'center',
      margin: `-${spacing * 2}px -${spacing * 3}px`,
      textAlign: 'center',
      width: 200,
    }}>
    SHOULD BE FLUSH AGAINST PARENT
  </div>
);

export const InterpolationsWithMinus = (): JSX.Element => (
  <div css={{ backgroundColor: 'red', padding: '16px 24px' }}>
    <FlushChild spacing={8} />
  </div>
);

const AnotherFlushChild = ({ spacing }: { spacing: number }) => (
  <div
    css={{
      alignItems: 'center',
      backgroundColor: 'blue',
      color: 'white',
      display: 'flex',
      height: 200,
      justifyContent: 'center',
      margin: `0 -${spacing * 2}px -${spacing * 3}px`,
      textAlign: 'center',
      width: 200,
    }}>
    SHOULD BE FLUSH AGAINST PARENT
  </div>
);

export const InterpolationsWithZeroAndMinus = (): JSX.Element => (
  <div css={{ backgroundColor: 'red', padding: '0 16px 24px' }}>
    <AnotherFlushChild spacing={8} />
  </div>
);
