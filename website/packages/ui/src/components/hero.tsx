/** @jsxImportSource @compiled/react */

const rgb = '101, 84, 192';
const step = 0.0185;
const size = 250;

export const Hero = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      css={{
        position: 'relative',
        overflow: 'hidden',
        background: `repeating-linear-gradient(
          35deg,
          rgba(${rgb}, ${step}),
          rgba(${rgb}, ${step * 2}) ${size}px,
          rgba(${rgb}, ${step * 3}) ${size}px,
          rgba(${rgb}, ${step * 4}) ${size * 2}px
        )`,
        ':after': {
          content: '',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 56,
          background: 'linear-gradient(rgba(255, 255, 255, 0), #fff)',
        },
      }}>
      <div
        css={{
          background: 'linear-gradient(120deg,#6554C0 0%, #FF7452 100%)',
          pointerEvents: 'none',
          position: 'absolute',
          top: '-20%',
          left: '-50%',
          right: '-50%',
          bottom: '11%',
          zIndex: -1,
        }}
      />
      {children}
    </div>
  );
};
