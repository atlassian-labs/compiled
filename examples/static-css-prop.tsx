/** @jsx jsx */
import { jsx } from '../src';

export default {
  title: 'static-css-prop',
};

export const staticCssProp = () => {
  return <div css={{ display: 'flex', fontSize: '50px', color: 'blue' }}>Hello, world!</div>;
};
