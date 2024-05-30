import { cssProp } from '@compiled/website-examples';
import { Example } from '@compiled/website-ui';

export const CssPropObj = () => {
  return (
    <Example
      exampleCode="<EmphasisText>Arrange</EmphasisText>"
      before={
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-obj.js')
          .default
      }
      after={
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-obj.js')
          .default
      }>
      <cssProp.CssPropObj>Arrange</cssProp.CssPropObj>
    </Example>
  );
};

export const CssPropString = () => {
  return (
    <Example
      exampleCode="<EmphasisText>Sort out</EmphasisText>"
      before={
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-string.js')
          .default
      }
      after={
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-string.js')
          .default
      }>
      <cssProp.CssPropString>Sort out</cssProp.CssPropString>
    </Example>
  );
};

export const CssPropDynamic = () => {
  return (
    <Example
      exampleCode="<EmphasisText primary>Systematize</EmphasisText>"
      before={
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-dynamic-decl.js')
          .default
      }
      after={
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-dynamic-decl.js')
          .default
      }>
      <cssProp.CssPropDynamic primary>Systematize</cssProp.CssPropDynamic>
    </Example>
  );
};

export const CssPropCompositionCorrect = () => {
  return (
    <Example
      exampleCode={'<CustomColorText color="pink">Pink text</CustomColorText>'}
      before={
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-composition-correct.js')
          .default
      }
      after={
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-composition-correct.js')
          .default
      }>
      <cssProp.CssPropCompositionCorrect color="pink">
        Pink text
      </cssProp.CssPropCompositionCorrect>
    </Example>
  );
};

export const CssPropCompositionIncorrect = () => {
  return (
    <Example
      exampleCode={
        '<CustomColorText color="pink">This text should be pink</CustomColorText>'
      }
      before={
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-composition-incorrect.js')
          .default
      }
      after={
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-composition-incorrect.js')
          .default
      }>
      <cssProp.CssPropCompositionIncorrect color="pink">
        This text should be pink
      </cssProp.CssPropCompositionIncorrect>
    </Example>
  );
};

export const CssPropCompositionNoStyle = () => {
  return (
    <Example
      exampleCode={
        '<CustomColorText color="pink">This text should be pink</CustomColorText>'
      }
      before={
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-composition-no-style.js')
          .default
      }
      after={
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-composition-no-style.js')
          .default
      }>
      <cssProp.CssPropCompositionNoStyle color="pink">
        This text should be pink
      </cssProp.CssPropCompositionNoStyle>
    </Example>
  );
};

export const CssPropConditionalRules = () => {
  return (
    <Example
      exampleCode="<Lozenge primary>Arrange</Lozenge>"
      before={
        require('!!raw-loader!@compiled/website-examples/dist/jsx/css-prop-conditional-rules.js')
          .default
      }
      after={
        require('!!raw-loader!@compiled/website-examples/dist/js/css-prop-conditional-rules.js')
          .default
      }>
      <cssProp.CssPropConditionalRules primary>Arrange</cssProp.CssPropConditionalRules>
    </Example>
  );
};
