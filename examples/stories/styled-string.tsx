import { styled, css } from '@compiled/react';
import { primary, secondary } from '../mixins/mixins';

export default {
  title: 'styled/string',
};

const SingleUse = styled.div`
  ${primary};
`;

const DoubleUse = styled.div`
  ${primary};
  ${secondary};
`;

const ArrayUse = styled.div(
  primary,
  secondary,
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
