import { styled } from '@compiled/react';

export default {
  title: 'styled/interpolations',
};

interface Props {
  color: string;
  bgColor: string;
  textSize: number;
  borderStyle: string;
  padding: number;
}

const FunctionStyledObjectLiteral = styled.div<Props>({
  color: ({ color }) => color,
  fontSize: (props) => `${props.textSize}px`,
  backgroundColor: (props) => {
    return props.bgColor;
  },
  border: `5px ${({ borderStyle: bs }: Props) => bs} black`,
  padding: `${(propz: Props) => {
    return propz.padding;
  }}px`,
});

const FunctionStyledTemplateLiteral = styled.div<Props>`
  color: ${({ color }) => color};
  font-size: ${(props) => props.textSize}px;
  background-color: ${(props) => {
    return props.bgColor;
  }};
  border: 5px ${({ borderStyle: bs }) => bs} black;
  padding: ${(propz) => {
    return propz.padding;
  }}px;
`;

export const ObjectLiteral = (): JSX.Element => (
  <FunctionStyledObjectLiteral
    color="blue"
    bgColor="red"
    textSize={18}
    borderStyle="dashed"
    padding={8}>
    hello world
  </FunctionStyledObjectLiteral>
);

export const TemplateLiteral = (): JSX.Element => (
  <FunctionStyledTemplateLiteral
    color="red"
    bgColor="blue"
    textSize={20}
    borderStyle="dotted"
    padding={10}>
    hello world
  </FunctionStyledTemplateLiteral>
);

const HorizontalStack = styled.div<{ spacing?: number; gap?: number }>`
  margin-top: ${(props) => props.spacing}rem;
  margin-bottom: ${(props) => props.spacing}rem;
  margin-right: ${(props) => props.gap}rem;

  @media only screen and (min-width: 900px) {
    && > * {
      margin-right: ${(props) => props.gap}rem;

      &:last-child {
        margin-right: 0;
      }
    }
  }
`;

export const Stacking = (): JSX.Element => (
  <>
    <div css={{ display: 'inline-block' }}>before</div>
    <HorizontalStack gap={2} spacing={4}>
      <div css={{ display: 'inline-block', backgroundColor: 'red' }}>one</div>
      <div css={{ display: 'inline-block', backgroundColor: 'blue' }}>two</div>
      <div css={{ display: 'inline-block', backgroundColor: 'purple' }}>three</div>
    </HorizontalStack>
    <div css={{ display: 'inline-block' }}>after</div>
  </>
);
