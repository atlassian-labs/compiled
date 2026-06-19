/** @jsx jsx */
// @ts-expect-error cssMapScoped is not public api
// eslint-disable-next-line import/named
import { cssMapScoped, jsx, styled } from '@compiled/react';
import { Fragment } from 'react';

import { Base } from './css-map-scoped-base';
import { Override } from './css-map-scoped-override';
import './extracted-component.compiled.css';

// Bundle four CSS sources together to verify the extracted CSS preserves
// non-atomic source order ACROSS files while still emitting atomic and
// pre-built CSS:
// - cssMapScoped from `./css-map-scoped-base` (non-atomic, imported FIRST)
// - cssMapScoped from `./css-map-scoped-override` (non-atomic, imported SECOND — must come AFTER base)
// - cssMapScoped declared in this file (non-atomic, current file)
// - pre-built `.compiled.css` import (atomic, from npm)
// - local atomic styles in this file (atomic)
const localStyles = cssMapScoped({
  default: { '.editor .toolbar': { backgroundColor: 'yellow' } },
});

const Styled = styled.div({
  color: 'blue',
});

export const App = (): JSX.Element => (
  <Fragment>
    <Base />
    <Override />
    <div css={localStyles.default} />
    <div css={{ fontSize: 14 }} />
    <Styled />
  </Fragment>
);
