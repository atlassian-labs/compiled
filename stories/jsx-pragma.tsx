/** @jsxRuntime classic */
/** @jsx jsx */
// TypeScript thinks we're using the automatic runtime however we've forced Babel
// using the pragmas above to use the classic runtime (referencing the jsx import).
// @ts-ignore
import { jsx } from '@compiled/react';

export default {
  title: 'css prop/jsx pragma',
};

const DivWithClassName = ({
  className,
  children,
}: {
  className?: string;
  children: JSX.Element;
}) => {
  return <div className={className}>{children}</div>;
};

const DivWithoutClassName = ({ children }: { children: JSX.Element }) => {
  return <div>{children}</div>;
};

export const LocalJSXNamespace = (): JSX.Element => (
  // @ts-expect-error — Hack to compile with jsx pragma
  <div css={{ fontSize: 30, color: 'blue' }}>Sourced from local JSX Namespace</div>
);

export const WithClassName = (): JSX.Element => (
  // @ts-expect-error — Hack to compile with jsx pragma
  <DivWithClassName css={{ color: 'red' }}>
    <span>Text is now red</span>
  </DivWithClassName>
);

export const NoClassName = (): JSX.Element => (
  // @ts-expect-error — Hack to compile with jsx pragma
  <DivWithoutClassName css={{ color: 'red' }}>
    <span>Text is NOT red and there is a type error</span>
  </DivWithoutClassName>
);
