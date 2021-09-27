import { css } from '@compiled/react';
import {
  primaryTaggedTemplateExpression,
  secondaryTaggedTemplateExpression,
} from '../mixins/mixins';

export default {
  title: 'css prop/string',
};

// Workaround missing CSS API without import https://github.com/atlassian-labs/compiled/issues/836
// TODO Remove this usage once bug is resolved
css``;

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
