import { css } from '@compiled/react';
import { primary, secondary } from '../mixins/mixins';

export default {
  title: 'css prop/string',
};

export const TemplateLiteral = (): JSX.Element => {
  return (
    <div
      css={`
        display: flex;
        font-size: 30px;
        color: blue;
      `}>
      blue text
    </div>
  );
};

export const InlineCssTaggedTemplateExpression = (): JSX.Element => {
  return (
    <div
      css={css`
        display: flex;
        font-size: 30px;
        color: red;
      `}>
      red text
    </div>
  );
};

const taggedTemplateExpressionCss = css`
  display: flex;
  font-size: 30px;
  color: green;
`;

export const CssTaggedTemplateExpression = (): JSX.Element => {
  return <div css={taggedTemplateExpressionCss}>green text</div>;
};

export const UsingMixinImportSpread = (): JSX.Element => {
  return <div css={{ ...primary }}>purple text spread</div>;
};

export const UsingMixinImportIdentifier = (): JSX.Element => {
  return <div css={primary}>purple text ident</div>;
};

export const UsingMixinImportArray = (): JSX.Element => {
  return <div css={[primary, secondary]}>purple text arr</div>;
};
