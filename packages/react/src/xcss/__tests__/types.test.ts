// eslint-disable-next-line import/no-extraneous-dependencies
import { expectTypeOf } from 'expect-type';

import xcss from '..';
import cx from '../cx';
import type { XCSSProp } from '../xcss';

describe('xcss valid tests', () => {
  it('should work with subset types', () => {
    expectTypeOf(xcss({ color: 'red' })).toMatchTypeOf<XCSSProp<'color', '&:active'>>();
  });

  it('should work with all types', () => {
    expectTypeOf(
      xcss({
        color: 'red',
        '&:active': {
          color: 'red',
        },
      })
    ).toMatchTypeOf<XCSSProp<'color', '&:active'>>();
  });

  it('should allow composition via cx', () => {
    expectTypeOf(
      cx(
        xcss({
          color: 'red',
          '&:active': {
            color: 'red',
          },
        })
      )
    ).toMatchTypeOf<XCSSProp<'color', '&:active'>>();
  });

  it('should work with false', () => {
    expectTypeOf<false>().toMatchTypeOf<XCSSProp<'color', '&:active'>>();
  });

  it('should work with undefined', () => {
    expectTypeOf<undefined>().toMatchTypeOf<XCSSProp<'color', '&:active'>>();
  });
});

describe('xcss invalid tests', () => {
  it('should reject arrays', () => {
    expectTypeOf([]).not.toMatchTypeOf<XCSSProp<'color', '&:active'>>();
  });

  it('should reject invalid pseudos', () => {
    expectTypeOf(
      xcss({
        '&:active': {
          color: 'red',
        },
      })
    ).not.toMatchTypeOf<XCSSProp<'color', '&:hover'>>();
  });

  it('should reject arrays of valid styles', () => {
    expectTypeOf([xcss({ color: 'red' })]).not.toMatchTypeOf<XCSSProp<'color', '&:active'>>();
  });

  it('should reject composition if invalid and via cx', () => {
    expectTypeOf(
      cx(
        xcss({
          background: 'red',
        })
      )
    ).not.toMatchTypeOf<XCSSProp<'color', '&:active'>>();
  });
});
