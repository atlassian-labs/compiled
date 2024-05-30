/** @jsxImportSource @compiled/react */
import type { CSSProperties } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-async';
import codeTheme from 'react-syntax-highlighter/dist/esm/styles/prism/tomorrow';

interface CodeBlockProps {
  children: string;
  className?: string;
  language?: string;
  style?: CSSProperties;
  variant?: 'sharp' | 'rounded';
}

const customTheme = Object.assign({}, codeTheme, {
  inserted: {
    color: 'rgb(126, 198, 153)',
    backgroundColor: 'rgba(126, 198, 153, 0.15)',
  },
  deleted: {
    backgroundColor: 'rgba(226, 119, 122, 0.15)',
    color: 'rgb(226, 119, 122)',
  },
});

export const CodeBlock = ({
  children,
  language = 'jsx',
  variant = 'rounded',
  className,
  style,
  ...props
}: CodeBlockProps) => (
  <div
    css={{
      fontSize: '2rem',
      backgroundColor: 'rgb(37, 56, 88)',
      boxShadow:
        'rgba(9, 30, 66, 0.25) 0px 12px 24px -6px, rgba(9, 30, 66, 0.31) 0px 0px 1px',
      borderRadius: variant === 'sharp' ? 0 : '5px',
      overflow: 'auto',
      display: 'flex',
      position: 'relative',
    }}
    className={className}
    style={style}
    {...props}>
    <SyntaxHighlighter
      language={language}
      style={customTheme}
      customStyle={{
        padding: 0,
        overflow: 'visible',
        margin: '2rem',
        background: 'transparent',
      }}>
      {children.replace(/^\n/, '').replace(/\n$/, '')}
    </SyntaxHighlighter>
    {/* Add spacing because padding is eliminated with overflow: visible */}
    <div css={{ width: '1px', flexShrink: 0 }} />
  </div>
);

export const Terminal = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      css={{
        padding: '2.5rem 0',
        pre: {
          margin: '0 !important',
          padding: '0 !important',
        },
      }}>
      <pre>
        <code
          css={{
            color: 'rgb(204, 204, 204)',
            fontSize: '16px',
            fontFamily: `'SFMono-Medium', 'SF Mono', 'Segoe UI Mono', 'Roboto Mono', 'Ubuntu Mono', Menlo, Consolas, Courier, monospace`,
            position: 'relative',
            opacity: 1,
            ':before': {
              content: '➜  ~ ',
              color: '#79F2C0',
              pointerEvents: 'none',
              position: 'absolute',
              left: -50,
            },
          }}>
          {children}
        </code>
      </pre>
    </div>
  );
};
