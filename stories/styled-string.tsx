import { css, styled } from '@compiled/react';

import { primaryTaggedTemplateExpression, secondaryTaggedTemplateExpression } from './mixins';

export default {
  title: 'styled/string',
};

const SingleUse = styled.div`
  ${primaryTaggedTemplateExpression};
`;

const DoubleUse = styled.div`
  ${primaryTaggedTemplateExpression};
  ${secondaryTaggedTemplateExpression};
`;

const ArrayUse = styled.div(
  primaryTaggedTemplateExpression,
  secondaryTaggedTemplateExpression,
  css`
    text-transform: uppercase;
  `
);

export const UsingMixinImportSpread = (): JSX.Element => {
  return <SingleUse>purple text single</SingleUse>;
};

export const UsingMixinImportIdentifier = (): JSX.Element => {
  return <ArrayUse>purple text arr</ArrayUse>;
};

export const UsingMixinImportArray = (): JSX.Element => {
  return <DoubleUse>purple text double</DoubleUse>;
};
