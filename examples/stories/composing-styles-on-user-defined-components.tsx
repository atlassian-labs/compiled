import { styled } from '@compiled/react';

export default {
  title: 'composition/user components',
};

const GreenFontCssProp = (props: { children: any; className?: string }) => (
  <h1 {...props} className={props.className} css={{ color: 'green' }} />
);

const GreenFontStyled = styled.h1`
  color: green;
`;

const RedFontWrapped = styled(GreenFontCssProp)({
  color: 'red',
});

const BlueFontWrapped = styled(GreenFontStyled)`
  color: blue;
`;

export const GreenCssProp = (): JSX.Element => <GreenFontCssProp>Green font</GreenFontCssProp>;

export const GreenStyled = (): JSX.Element => <GreenFontStyled>Green font</GreenFontStyled>;

export const RedWrapped = (): JSX.Element => <RedFontWrapped>Red font</RedFontWrapped>;

export const BlueWrapped = (): JSX.Element => <BlueFontWrapped>Blue font</BlueFontWrapped>;
