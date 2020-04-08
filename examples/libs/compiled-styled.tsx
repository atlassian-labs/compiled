import { styled } from '@compiled/css-in-js';

export const Static = styled.div`
  margin: 10px;
  font-size: 30px;
`;

export const Dynamic = styled.div<{ color: string }>`
  margin: 10px;
  font-size: 30px;
  color: ${props => props.color};
`;
