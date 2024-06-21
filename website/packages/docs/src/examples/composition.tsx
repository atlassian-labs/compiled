import { composition } from '@compiled/website-examples';
import { Example } from '@compiled/website-ui';

export const CompositionIdentifier = (): JSX.Element => {
  return (
    <Example
      before={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-composition-identifier.js')
          .default
      }
      after={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-composition-identifier.js')
          .default
      }>
      <composition.CompositionIdentifier />
    </Example>
  );
};

export const CompositionMultiple = (): JSX.Element => {
  return (
    <Example
      before={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-composition-multiple.js')
          .default
      }
      after={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-composition-multiple.js')
          .default
      }>
      <composition.CompositionMultiple />
    </Example>
  );
};
