import { act, render } from '@testing-library/react';
import React from 'react';

import { CC, CS } from '../index';

const SHEET = '._foo{display:none}';

const getCompiledStyles = () =>
  Array.from(document.querySelectorAll('style[data-cmpld]'))
    .map((style) => style.textContent)
    .join('');

const StyledChild = ({ label }: { label: string }) => (
  <CC>
    <CS>{[SHEET]}</CS>
    <div className="_foo" data-testid="target">
      {label}
    </div>
  </CC>
);

describe('style cache in jsdom', () => {
  it('renders an inline style tag when a cached sheet remounts after its style element unmounted', () => {
    let setShowFallback: React.Dispatch<React.SetStateAction<boolean>> | undefined;

    const Switcher = () => {
      const [showFallback, updateShowFallback] = React.useState(true);
      setShowFallback = updateShowFallback;

      return showFallback ? <StyledChild label="fallback" /> : <StyledChild label="final" />;
    };

    const { getByTestId } = render(
      <CC>
        <Switcher />
      </CC>
    );

    expect(getByTestId('target').textContent).toBe('fallback');
    expect(getCompiledStyles()).toInclude(SHEET);

    act(() => {
      setShowFallback?.(false);
    });

    expect(getByTestId('target').textContent).toBe('final');
    expect(getByTestId('target').className).toBe('_foo');
    expect(getCompiledStyles()).toInclude(SHEET);
  });
});
