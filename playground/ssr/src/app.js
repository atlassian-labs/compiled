import * as React from 'react';
import '@compiled/react';

const Footer = () => <footer css={{ background: 'purple', padding: 8 * 4 }}>footer</footer>;

const Header = () => (
  <header
    css={{
      padding: `0 ${8 * 4}px`,
      background: 'red',
      height: 56,
      display: 'flex',
      alignItems: 'center',
    }}>
    server side rendering
  </header>
);

const Content = () => (
  <main css={{ padding: 8 * 4, height: '200vh', background: 'blue' }}>content</main>
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
