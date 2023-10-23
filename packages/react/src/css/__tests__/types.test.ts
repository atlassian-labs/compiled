/** @jsxImportSource @compiled/react */
// eslint-disable-next-line import/no-extraneous-dependencies
import { css } from '@compiled/react';
import { expectTypeOf } from 'expect-type';

describe('css func tests', () => {
  it('should type violate when given invalid types', () => {
    const style = css({ color: 'red' });

    expectTypeOf(style).not.toMatchTypeOf<string>();
  });
});
