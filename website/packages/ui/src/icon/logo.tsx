/** @jsxImportSource @compiled/react */
import React from 'react';

export const Logo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="200"
    height="50"
    viewBox="0 0 200 50"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    css={{
      display: 'inline-block',
      verticalAlign: 'middle',
    }}>
    <rect x="10" y="10" width="180" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M30 20 Q35 20 35 25 Q35 30 40 30 Q35 30 35 35 Q35 40 30 40" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M170 20 Q165 20 165 25 Q165 30 160 30 Q165 30 165 35 Q165 40 170 40" fill="none" stroke="currentColor" strokeWidth="2"/>
    <text x="50" y="35" fontFamily="Monaco, Consolas, monospace" fontSize="20" fill="currentColor">compiled</text>
  </svg>
);