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

export const Hover = () => <PseudoStates>Should be red</PseudoStates>;
Hover.args = { pseudo: { hover: true } };

export const Focus = () => <PseudoStates>Should be blue</PseudoStates>;
Focus.args = { pseudo: { focus: true } };

export const Link = () => <PseudoStates>Should be pink</PseudoStates>;
Link.args = { pseudo: { link: true } };

export const Target = () => <PseudoStates>Should be purple</PseudoStates>;
Target.args = { pseudo: { target: true } };

export const FocusWithin = () => <PseudoStates>Should be orange</PseudoStates>;
FocusWithin.args = { pseudo: { focusWithin: true } };

export const Visited = () => <PseudoStates>Should be brown</PseudoStates>;
Visited.args = { pseudo: { visited: true } };

export const Active = () => <PseudoStates>Should be yellow</PseudoStates>;
Active.args = { pseudo: { active: true } };
