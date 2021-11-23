import { styled } from '@compiled/react';

export default {
  title: 'styled/combinators',
};

export const AdjacentSiblingCombinator = (): JSX.Element => {
  const Text = styled.div`
    border: 1px solid red;

    & + & {
      margin-top: 10px;
      color: green;
    }
  `;

  return (
    <div>
      <Text>Row 1</Text>
      <Text>Row 2</Text>
      <Text>Row 3</Text>
      <Text>Row 4</Text>
    </div>
  );
};

export const GeneralSiblingCombinator = (): JSX.Element => {
  const Text = styled.div`
    & ~ & {
      color: red;
    }
  `;

  return (
    <div>
      <div>div</div>
      <Text>Black text</Text>
      <div>div</div>
      <Text>Red text</Text>
      <Text>Red text</Text>
    </div>
  );
};

export const ChildCombinator = (): JSX.Element => {
  const Box = styled.div`
    & > & {
      color: red;
    }
  `;

  return (
    <Box>
      Box
      <Box>
        Box in Box
        <Box>
          Box in Box in Box
          <div>div in Box in Box in Box</div>
        </Box>
      </Box>
    </Box>
  );
};
