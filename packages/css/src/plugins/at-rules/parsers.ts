import type {
  BasicMatchInfo,
  ComparisonOperator,
  LengthInfo,
  LengthUnit,
  OperatorInfo,
  ParsedAtRule,
  Property,
  PropertyInfo,
} from './types';

function isPropertyValid(property: string): property is Property {
  return ['width', 'height'].includes(property);
}

function isComparisonOperatorValid(
  operator: string
): operator is OperatorInfo['comparisonOperator'] {
  return ['<=', '=', '>=', '<', '>'].includes(operator);
}

const convertMinMaxMediaQuery = (
  match: RegExpMatchArray
): (PropertyInfo & OperatorInfo) | undefined => {
  const property = match.groups?.property;
  switch (property) {
    case 'min-width':
      // min-width: XYZ
      // is the same as
      // width >= XYZ
      return {
        property: 'width',
        comparisonOperator: '>=',
      };
    case 'max-width':
      // max-width: XYZ
      // is the same as
      // width <= XYZ
      return {
        property: 'width',
        comparisonOperator: '<=',
      };
    case 'min-height':
      return {
        property: 'height',
        comparisonOperator: '>=',
      };
    case 'min-height':
      return {
        property: 'height',
        comparisonOperator: '<=',
      };
    case undefined:
      return;
    default:
      throw new Error(`Unexpected property '${property}' found when sorting media queries`);
  }
};

const reverseComparisonOperator = (operator: ComparisonOperator): ComparisonOperator => {
  // We expect <width|height> <comparisonOperator> <length>, but we actually got
  // <length> <comparisonOperator> <width|height>. So we need to normalise it by
  // reversing the operator.
  switch (operator) {
    case '<':
      return '>';
    case '>':
      return '<';
    case '<=':
      return '>=';
    case '>=':
      return '<=';
    case '=':
      return '=';
  }
};

const getProperty = (match: RegExpMatchArray): PropertyInfo | undefined => {
  const property = match.groups?.property;

  if (property === undefined) {
    return;
  }

  if (isPropertyValid(property)) {
    return {
      property,
    };
  }

  throw new Error(`Unexpected property '${property}' found when sorting media queries.`);
};

const getOperator = (
  match: RegExpMatchArray,
  reverse: 'reverse' | 'no-reverse',
  groupName = 'operator'
): OperatorInfo | undefined => {
  const operator = match.groups?.[groupName];

  if (operator === undefined) {
    return;
  }

  if (isComparisonOperatorValid(operator)) {
    return {
      comparisonOperator: reverse === 'reverse' ? reverseComparisonOperator(operator) : operator,
    };
  }

  throw new Error(`Unexpected comparison operator '${operator}' found when sorting media queries.`);
};

const getLengthInfo = (match: RegExpMatchArray, groupName = 'length'): LengthInfo | undefined => {
  const length_ = match.groups?.[groupName];
  const lengthUnit = match.groups?.[groupName];

  if (typeof length_ !== 'string' || typeof lengthUnit !== 'string') {
    return undefined;
  }
  return {
    length: +length_,
    lengthUnit: lengthUnit as LengthUnit,
  };
};

const getBasicMatchInfo = (match: RegExpMatchArray): BasicMatchInfo | undefined => {
  if (!match.index) {
    return;
  }

  return { index: match.index, match: match[0] };
};

export const parseSituationOne = (match: RegExpMatchArray): ParsedAtRule | undefined => {
  const basicMatchInfo = getBasicMatchInfo(match);
  const propertyAndOperatorInfo = convertMinMaxMediaQuery(match);
  const lengthInfo = getLengthInfo(match);

  if (basicMatchInfo && propertyAndOperatorInfo && lengthInfo) {
    return {
      ...basicMatchInfo,
      ...propertyAndOperatorInfo,
      ...lengthInfo,
    };
  }

  return;
};

export const parseSituationTwo = (match: RegExpMatchArray): ParsedAtRule | undefined => {
  const basicMatchInfo = getBasicMatchInfo(match);
  const propertyInfo = getProperty(match);
  const operatorInfo = getOperator(match, 'reverse');
  const lengthInfo = getLengthInfo(match);

  if (basicMatchInfo && propertyInfo && operatorInfo && lengthInfo) {
    return {
      ...basicMatchInfo,
      ...propertyInfo,
      ...operatorInfo,
      ...lengthInfo,
    };
  }

  return;
};

export const parseSituationThree = (match: RegExpMatchArray): ParsedAtRule | undefined => {
  const basicMatchInfo = getBasicMatchInfo(match);
  const propertyInfo = getProperty(match);
  const operatorInfo = getOperator(match, 'no-reverse');
  const lengthInfo = getLengthInfo(match);

  if (basicMatchInfo && propertyInfo && operatorInfo && lengthInfo) {
    return {
      ...basicMatchInfo,
      ...propertyInfo,
      ...operatorInfo,
      ...lengthInfo,
    };
  }

  return;
};

export const parseSituationFour = (match: RegExpMatchArray): ParsedAtRule | undefined => {
  const basicMatchInfo = getBasicMatchInfo(match);
  const propertyInfo = getProperty(match);
  const firstOperatorInfo = getOperator(match, 'reverse');
  const secondOperatorInfo = getOperator(match, 'no-reverse', 'operator2');
  const lengthInfo = getLengthInfo(match);
  const lengthInfo2 = getLengthInfo(match, 'operator2');

  if (
    basicMatchInfo &&
    propertyInfo &&
    firstOperatorInfo &&
    secondOperatorInfo &&
    lengthInfo &&
    lengthInfo2
  ) {
    return {
      ...basicMatchInfo,
      ...propertyInfo,
      ...firstOperatorInfo,
      ...secondOperatorInfo,
      ...lengthInfo,
      ...lengthInfo2,
    };
  }

  return;
};
