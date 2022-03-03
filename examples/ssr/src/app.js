import * as React from 'react';
import '@compiled/react';

const Footer = () => <footer css={{ background: 'purple', padding: 8 * 4 }}>footer</footer>;

const Header = () => (
  <header
    css={{
      alignItems: 'center',
      background: 'red',
      display: 'flex',
      height: 56,
      padding: `0 ${8 * 4}px`,
    }}>
    server side rendering
  </header>
);

const Content = () => (
  <main css={{ background: 'blue', height: '200vh', padding: 8 * 4 }}>content</main>
);

export default function Home() {
  return (
    <div css={{ fontSize: '100%' }}>
      <Header />
      <Content />
      <Footer />
    </div>
  );
}
