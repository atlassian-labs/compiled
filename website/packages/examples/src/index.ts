import { Button as ClassNamesButton } from './class-names-button';
import { CustomColorText as ClassNamesComposition } from './class-names-composition';
import { EmphasisText as ClassNamesDynamic } from './class-names-dynamic';
import { EmphasisText as ClassNamesObj } from './class-names-obj';
import { Button as CssPropButton } from './css-prop-button';
import { CustomColorText as CssPropCompositionCorrect } from './css-prop-composition-correct';
import { CompositionIdentifier } from './css-prop-composition-identifier';
import { CustomColorText as CssPropCompositionIncorrect } from './css-prop-composition-incorrect';
import { CompositionMultiple } from './css-prop-composition-multiple';
import { CustomColorText as CssPropCompositionNoStyle } from './css-prop-composition-no-style';
import { Lozenge as CssPropConditionalRules } from './css-prop-conditional-rules';
import { EmphasisText as CssPropDynamic } from './css-prop-dynamic-decl';
import { EmphasisText as CssPropObj } from './css-prop-obj';
import { EmphasisText as CssPropString } from './css-prop-string';
import { Heading as StyledAsProp } from './styled-as-prop';
import { Button as StyledButton } from './styled-button';
import { BlueText as StyledComposition } from './styled-composition';
import { EmphasisText as StyledDynamic } from './styled-dynamic-decl';
import { ColoredText as StyledObj } from './styled-obj';
import { ColoredText as StyledString } from './styled-string';
import { TransientProps } from './styled-transient-props';

export const styled = {
  Button: StyledButton,
  StyledString,
  StyledObj,
  StyledDynamic,
  TransientProps,
  StyledComposition,
  StyledAsProp,
};

export const cssProp = {
  Button: CssPropButton,
  CssPropObj,
  CssPropString,
  CssPropDynamic,
  CssPropCompositionCorrect,
  CssPropCompositionIncorrect,
  CssPropCompositionNoStyle,
  CssPropConditionalRules,
};

export const classNames = {
  Button: ClassNamesButton,
  ClassNamesObj,
  ClassNamesDynamic,
  ClassNamesComposition,
};

export const composition = {
  CompositionMultiple,
  CompositionIdentifier,
};
