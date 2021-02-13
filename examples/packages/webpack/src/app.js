import '@compiled/react';
import { primary } from './module';
import HelloWorld from './component';

export default function Home() {
  return (
    <>
      <div css={{ fontSize: 50, color: primary }}>hello from webpack</div>
      <HelloWorld>TypeScript component</HelloWorld>
    </>
  );
}
