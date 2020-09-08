import React from 'react';
import { styled } from '@compiled/core';

export default {
  title: 'composing styles on user defined components',
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

export const GreenCssProp = () => <GreenFontCssProp>Green font</GreenFontCssProp>;

export const GreenStyled = () => <GreenFontStyled>Green font</GreenFontStyled>;

export const RedWrapped = () => <RedFontWrapped>Red font</RedFontWrapped>;

export const BlueWrapped = () => <BlueFontWrapped>Blue font</BlueFontWrapped>;
