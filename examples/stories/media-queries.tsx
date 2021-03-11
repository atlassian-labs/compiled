import { styled } from '@compiled/react';

export default {
  title: 'media queries/styled',
};

const ResponsiveStyledObjectLiteral = styled.div({
  color: 'blue',
  fontSize: 50,
  '@media screen and (min-width: 800px)': {
    color: 'red',
    fontSize: 30,
  },
});

const ResponsiveStyledTemplateLiteral = styled.div`
  color: blue;
  font-size: 50px;

  @media screen and (min-width: 800px) {
    color: red;
    font-size: 30px;
  }
`;

export const ObjectLiteral = (): JSX.Element => (
  <ResponsiveStyledObjectLiteral>hello world</ResponsiveStyledObjectLiteral>
);

export const TemplateLiteral = (): JSX.Element => (
  <ResponsiveStyledTemplateLiteral>hello world</ResponsiveStyledTemplateLiteral>
);
