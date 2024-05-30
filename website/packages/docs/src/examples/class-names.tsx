import { classNames } from '@compiled/website-examples';
import { Example } from '@compiled/website-ui';

export const ClassNamesObj = () => {
  return (
    <Example
      exampleCode="<EmphasisText>Teal text</EmphasisText>"
      before={
        require('!!raw-loader!@compiled/website-examples/dist/jsx/class-names-obj.js')
          .default
      }
      after={
        require('!!raw-loader!@compiled/website-examples/dist/js/class-names-obj.js')
          .default
      }>
      <classNames.ClassNamesObj>Teal text</classNames.ClassNamesObj>
    </Example>
  );
};

export const ClassNamesDynamic = () => {
  return (
    <Example
      exampleCode="<EmphasisText primary>Teal text</EmphasisText>"
      before={
        require('!!raw-loader!@compiled/website-examples/dist/jsx/class-names-dynamic.js')
          .default
      }
      after={
        require('!!raw-loader!@compiled/website-examples/dist/js/class-names-dynamic.js')
          .default
      }>
      <classNames.ClassNamesDynamic primary>
        Teal text
      </classNames.ClassNamesDynamic>
    </Example>
  );
};

export const ClassNamesComposition = () => {
  return (
    <Example
      exampleCode={'<CustomColorText color="pink">Pink text</CustomColorText>'}
      before={
        require('!!raw-loader!@compiled/website-examples/dist/jsx/class-names-composition.js')
          .default
      }
      after={
        require('!!raw-loader!@compiled/website-examples/dist/js/class-names-composition.js')
          .default
      }>
      <classNames.ClassNamesComposition color="pink">
        Pink text
      </classNames.ClassNamesComposition>
    </Example>
  );
};
