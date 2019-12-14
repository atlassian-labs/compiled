/** @jsx jsx */
import { jsx } from '../src';

var backgroundMixin = {
  color: 'green',
};

export default {
  title: 'static-mixins',
};

export var staticMixins = () => {
  return (
    <div
      css={{
        display: 'flex',
        fontSize: '50px',
        color: 'blue',
        ...backgroundMixin,
      }}>
      Hello, world!
    </div>
  );
};
