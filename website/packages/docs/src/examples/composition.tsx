import { composition } from '@compiled/website-examples';
import { Example } from '@compiled/website-ui';

export const CompositionIdentifier = () => {
  return (
    <Example
      before={
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-composition-identifier.js')
          .default
      }
      after={
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-composition-identifier.js')
          .default
      }>
      <composition.CompositionIdentifier />
    </Example>
  );
};

export const CompositionMultiple = () => {
  return (
    <Example
      before={
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-composition-multiple.js')
          .default
      }
      after={
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-composition-multiple.js')
          .default
      }>
      <composition.CompositionMultiple />
    </Example>
  );
};
