import { styled } from '@compiled/react';

export default {
  title: 'atomic/pseudo states',
};

const PseudoStates = styled.a`
  :hover {
    color: red;
  }

  :focus {
    color: blue;
  }

  :link {
    color: pink;
  }

  :target {
    color: purple;
  }

  :focus-within {
    color: orange;
  }

  :visited {
    color: brown;
  }

  :active {
    color: yellow;
  }
`;

export const Hover = (): JSX.Element => <PseudoStates>Should be red</PseudoStates>;
Hover.parameters = { pseudo: { hover: true } };

export const Focus = (): JSX.Element => <PseudoStates>Should be blue</PseudoStates>;
Focus.parameters = { pseudo: { focus: true } };

export const Link = (): JSX.Element => <PseudoStates>Should be pink</PseudoStates>;
Link.parameters = { pseudo: { link: true } };

export const Target = (): JSX.Element => <PseudoStates>Should be purple</PseudoStates>;
Target.parameters = { pseudo: { target: true } };

export const FocusWithin = (): JSX.Element => <PseudoStates>Should be orange</PseudoStates>;
FocusWithin.parameters = { pseudo: { focusWithin: true } };

export const Visited = (): JSX.Element => <PseudoStates>Should be brown</PseudoStates>;
Visited.parameters = { pseudo: { visited: true } };

export const Active = (): JSX.Element => <PseudoStates>Should be yellow</PseudoStates>;
Active.parameters = { pseudo: { active: true } };
