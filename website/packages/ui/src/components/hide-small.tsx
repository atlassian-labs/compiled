import { styled } from '@compiled/react';

export const HideSmall = styled.span`
  display: none;

  @media only screen and (min-width: 900px) {
    display: inline;
  }
`;
