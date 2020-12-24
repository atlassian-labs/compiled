import { styled } from '@compiled/react';
import { objectStyles, colorMixin } from 'module-a';

export default {
  title: 'mixins/simple functions',
};

const StyledObjectLiteral = styled.div({
  ...objectStyles,
  ...colorMixin(),
});

const StyledTemplateLiteral = styled.div`
  color: ${objectStyles.color};
  background-color: ${objectStyles.backgroundColor()};
`;

export const ObjectLiteral = () => (
  <>
    <StyledObjectLiteral>Hello styled component</StyledObjectLiteral>
    <div
      css={{
        margin: '4px 0',
        padding: 4,
        border: `1px solid ${objectStyles.backgroundColor()}`,
        ':hover': colorMixin(),
      }}>
      Hello css prop component. Hover me Please.
    </div>
  </>
);

export const TemplateLiteral = () => (
  <>
    <StyledTemplateLiteral>Hello styled component</StyledTemplateLiteral>
    <div
      css={`
        margin: 4px 0;
        padding: 4px;
        border: 1px solid ${objectStyles.backgroundColor()};
        :hover {
          color: ${objectStyles.color};
          background-color: ${objectStyles.backgroundColor()};
        }
      `}>
      Hello css prop component. Hover me Please.
    </div>
  </>
);
