import { classNames } from '@compiled/website-examples';
import { Example } from '@compiled/website-ui';

export const ClassNamesObj = (): JSX.Element => {
  return (
    <Example
      exampleCode="<EmphasisText>Teal text</EmphasisText>"
      before={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/jsx/class-names-obj.js').default
      }
      after={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/js/class-names-obj.js').default
      }>
      <classNames.ClassNamesObj>Teal text</classNames.ClassNamesObj>
    </Example>
  );
};

export const ClassNamesDynamic = (): JSX.Element => {
  return (
    <Example
      exampleCode="<EmphasisText primary>Teal text</EmphasisText>"
      before={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/jsx/class-names-dynamic.js').default
      }
      after={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/js/class-names-dynamic.js').default
      }>
      <classNames.ClassNamesDynamic primary>Teal text</classNames.ClassNamesDynamic>
    </Example>
  );
};

export const ClassNamesComposition = (): JSX.Element => {
  return (
    <Example
      exampleCode={'<CustomColorText color="pink">Pink text</CustomColorText>'}
      before={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/jsx/class-names-composition.js')
          .default
      }
      after={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/js/class-names-composition.js')
          .default
      }>
      <classNames.ClassNamesComposition color="pink">Pink text</classNames.ClassNamesComposition>
    </Example>
  );
};
