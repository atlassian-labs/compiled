import {
  primaryTaggedTemplateExpression,
  secondaryTaggedTemplateExpression,
} from '../mixins/mixins';

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

export const UsingMixinImportSpread = (): JSX.Element => {
  return <div css={{ ...primaryTaggedTemplateExpression }}>purple text spread</div>;
};

export const UsingMixinImportIdentifier = (): JSX.Element => {
  return <div css={primaryTaggedTemplateExpression}>purple text ident</div>;
};

export const UsingMixinImportArray = (): JSX.Element => {
  return (
    <div css={[primaryTaggedTemplateExpression, secondaryTaggedTemplateExpression]}>
      purple text arr
    </div>
  );
};
