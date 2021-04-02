import { styled } from '@compiled/react';

const LoadedAsync = styled.button`
  font-weight: 700;
  color: purple;
  border: 2px solid pink;
  background-color: transparent;

  :focus {
    color: blue;
  }

  :hover {
    color: red;
  }

  @media (min-width: 500px) {
    border: 2px solid red;
  }
`;

export default LoadedAsync;
