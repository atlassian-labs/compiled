/** @jsx jsx */
import React from 'react';
import { jsx } from '@compiled/css-in-js';
import { codeBackground } from '../utils/colors';

export const CodeBlock = (props: { children: string; className?: string }) => (
  <pre
    className={props.className}
    css={{ backgroundColor: codeBackground, padding: '2rem', margin: '1rem' }}>
    <code
      css={{
        fontSize: '2rem',
        fontFamily:
          "'SFMono-Medium', 'SF Mono', 'Segoe UI Mono', 'Roboto Mono', 'Ubuntu Mono', Menlo, Consolas, Courier, monospace`",
      }}>
      {props.children.replace(/^\n/, '')}
    </code>
  </pre>
);
