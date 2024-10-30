import { cssProp } from '@compiled/website-examples';
import { Example } from '@compiled/website-ui';
import { Fragment } from 'react';

export const CssPropObj = (): JSX.Element => {
  return (
    <Example
      exampleCode="<EmphasisText>Arrange</EmphasisText>"
      before={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-obj.js').default
      }
      after={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-obj.js').default
      }>
      <cssProp.CssPropObj>Arrange</cssProp.CssPropObj>
    </Example>
  );
};

export const CssPropString = (): JSX.Element => {
  return (
    <Example
      exampleCode="<EmphasisText>Sort out</EmphasisText>"
      before={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-string.js').default
      }
      after={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-string.js').default
      }>
      <cssProp.CssPropString>Sort out</cssProp.CssPropString>
    </Example>
  );
};

export const CssPropDynamic = (): JSX.Element => {
  return (
    <Example
      exampleCode="<EmphasisText primary>Systematize</EmphasisText>"
      before={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-dynamic-decl.js').default
      }
      after={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-dynamic-decl.js').default
      }>
      <cssProp.CssPropDynamic primary>Systematize</cssProp.CssPropDynamic>
    </Example>
  );
};

export const CssPropCompositionCorrect = (): JSX.Element => {
  return (
    <Example
      exampleCode={'<CustomColorText color="pink">Pink text</CustomColorText>'}
      before={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-composition-correct.js')
          .default
      }
      after={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-composition-correct.js')
          .default
      }>
      <cssProp.CssPropCompositionCorrect color="pink">Pink text</cssProp.CssPropCompositionCorrect>
    </Example>
  );
};

export const CssPropCompositionIncorrect = (): JSX.Element => {
  return (
    <Example
      exampleCode={'<CustomColorText color="pink">This text should be pink</CustomColorText>'}
      before={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-composition-incorrect.js')
          .default
      }
      after={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-composition-incorrect.js')
          .default
      }>
      <cssProp.CssPropCompositionIncorrect color="pink">
        This text should be pink
      </cssProp.CssPropCompositionIncorrect>
    </Example>
  );
};

export const CssPropCompositionNoStyle = (): JSX.Element => {
  return (
    <Example
      exampleCode={'<CustomColorText color="pink">This text should be pink</CustomColorText>'}
      before={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-composition-no-style.js')
          .default
      }
      after={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-composition-no-style.js')
          .default
      }>
      <cssProp.CssPropCompositionNoStyle color="pink">
        This text should be pink
      </cssProp.CssPropCompositionNoStyle>
    </Example>
  );
};

export const CssPropConditionalRules = (): JSX.Element => {
  return (
    <Example
      exampleCode="<LargeText>Hello</LargeText><LargeText inverted>world</LargeText>"
      before={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-conditional-rules.js')
          .default
      }
      after={
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-conditional-rules.js')
          .default
      }>
      <Fragment>
        <cssProp.CssPropConditionalRules>Hello</cssProp.CssPropConditionalRules>
        <cssProp.CssPropConditionalRules inverted>world</cssProp.CssPropConditionalRules>
      </Fragment>
    </Example>
  );
};
