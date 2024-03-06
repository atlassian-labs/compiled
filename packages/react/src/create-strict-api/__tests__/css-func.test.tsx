/** @jsxImportSource @compiled/react */
// eslint-disable-next-line import/no-extraneous-dependencies
import { css } from '@compiled/react';
import type { XCSSProp } from '@fixture/strict-api-test';
import { css as strictCSS } from '@fixture/strict-api-test';
import { render } from '@testing-library/react';

function Button({
  xcss,
  testId,
}: {
  testId: string;
  xcss: ReturnType<typeof XCSSProp<'backgroundColor', '&:hover'>>;
}) {
  return <button data-testid={testId} className={xcss} />;
}

describe('css func from strict api', () => {
  it('should type error when passing css func result into xcss prop', () => {
    const strictStyles = strictCSS({
      backgroundColor: 'var(--ds-surface)',
    });
    const looseStyles = css({
      backgroundColor: 'red',
    });

    const { getByTestId } = render(
      <>
        <Button
          testId="button-1"
          // @ts-expect-error — CSS func currently doesn't work with XCSS prop so should type error
          xcss={strictStyles}
        />
        <Button
          testId="button-2"
          // @ts-expect-error — CSS func currently doesn't work with XCSS prop so should type error
          xcss={looseStyles}
        />
        <div data-testid="div-1" css={[strictStyles, looseStyles]} />
        <div data-testid="div-2" css={[looseStyles, strictStyles]} />
      </>
    );

    expect(getByTestId('button-1').className).toEqual('');
    expect(getByTestId('button-2').className).toEqual('');
    expect(getByTestId('div-1')).toHaveCompiledCss('background-color', 'red');
    expect(getByTestId('div-2')).toHaveCompiledCss('background-color', 'var(--ds-surface)');
  });
});
