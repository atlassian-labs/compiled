import { render } from '@testing-library/react';
import React from 'react';
import '@compiled/css-in-js';

it('should detect styles', () => {
  const { getByText } = render(
    <div
      css={{
        fontSize: '12px',
      }}>
      hello world
    </div>
  );

  expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
});

it('should detect missing styles', () => {
  const { getByText } = render(<div css={{ fontSize: '12px' }}>hello world</div>);

  expect(getByText('hello world')).not.toHaveCompiledCss('color', 'blue');
});

it('should detect multiple styles', () => {
  const { getByText } = render(<div css={{ fontSize: '12px', color: 'blue' }}>hello world</div>);

  expect(getByText('hello world')).toHaveCompiledCss({
    fontSize: '12px',
    color: 'blue',
  });
});

it('should detect single missing styles', () => {
  const { getByText } = render(<div css={{ fontSize: '12px', color: 'blue' }}>hello world</div>);

  expect(getByText('hello world')).not.toHaveCompiledCss({
    zindex: '9999',
  });
});

it('should detect multiple missing styles', () => {
  const { getByText } = render(<div css={{ fontSize: '12px', color: 'blue' }}>hello world</div>);

  expect(getByText('hello world')).not.toHaveCompiledCss({
    backgroundColor: 'yellow',
    zindex: '9999',
  });
});

it('should detect evaluated rule from array styles', () => {
  const base = { fontSize: 12 };
  const next = ` font-size: 15px; `;

  const { getByText } = render(<div css={[base, next]}>hello world</div>);
  expect(getByText('hello world')).toHaveCompiledCss('font-size', '15px');
  expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
});
