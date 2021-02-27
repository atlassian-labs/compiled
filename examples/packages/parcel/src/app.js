import * as React from 'react';
import '@compiled/react';
import { primary } from './module';
import TypeScriptComponent from './ts';

export default function Home() {
  return (
    <>
      <div css={{ fontSize: 50, color: primary }}>hello from parcel 2</div>
      <TypeScriptComponent color="blue" />
    </>
  );
}
