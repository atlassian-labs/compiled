/** @jsx jsx */
import React, { useState } from 'react';
import { jsx } from '@compiled/css-in-js';
import { CodeBlock } from './code-block';

interface ComparisonProps {
  before: string;
  after: string;
}

export const Comparison = (props: ComparisonProps) => {
  return (
    <div
      css={{
        display: 'flex',
        alignItems: 'stretch',
      }}>
      <CodeBlock>{props.before}</CodeBlock>
      <CodeBlock>{props.after}</CodeBlock>
    </div>
  );
};
