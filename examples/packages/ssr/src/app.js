import * as React from 'react';
import '@compiled/react';
import { SSRCacheComponent } from '@compiled/react/runtime';

const Footer = () => <footer css={{ background: 'purple', padding: 8 * 4 }}>footer</footer>;

const Header = () => (
  <header
    css={{
      padding: `0 ${8 * 4}px`,
      background: 'red',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      '@media only screen and (max-width:1100px)': {
        background: 'green',
      },
    }}>
    server side rendering
  </header>
);

const Button = ({ count, setCount }) => (
  <button css={{ background: 'white', borderRadius: 3 }} onClick={() => setCount((count += 1))}>
    Count {count}
  </button>
);

const Content = () => (
  <main css={{ padding: 8 * 4, height: '200vh', background: 'blue' }}>content</main>
);

export default function Home() {
  const [count, setCount] = React.useState(0);
  return (
    <div css={{ fontSize: '100%' }}>
      <Header />
      <Button count={count} setCount={setCount} />
      <Content />
      <Footer />
      <SSRCacheComponent />
    </div>
  );
}
