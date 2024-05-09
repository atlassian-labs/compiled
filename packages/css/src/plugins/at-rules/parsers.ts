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

const REM_SIZE = 16;

function isPropertyValid(property: string): property is Property {
  return ['width', 'height', 'device-width', 'device-height'].includes(property);
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
    case 'min-device-width':
      // min-width: XYZ
      // is the same as
      // width >= XYZ
      return {
        property: property === 'min-width' ? 'width' : 'device-width',
        comparisonOperator: '>=',
      };
    case 'max-width':
    case 'max-device-width':
      // max-width: XYZ
      // is the same as
      // width <= XYZ
      return {
        property: property === 'max-width' ? 'width' : 'device-width',
        comparisonOperator: '<=',
      };
    case 'min-height':
    case 'min-device-height':
      return {
        property: property === 'min-height' ? 'height' : 'device-height',
        comparisonOperator: '>=',
      };
    case 'max-height':
    case 'max-device-height':
      return {
        property: property === 'max-height' ? 'height' : 'device-height',
        comparisonOperator: '<=',
      };
    case undefined:
      return;
    default:
      throw new SyntaxError(`Unexpected property '${property}' found when sorting media queries`);
  }
};

/**
 * This runs when we expect
 *
 *     <width|height> <comparisonOperator> <length>
 *
 * but we actually got
 *
 *     <length> <comparisonOperator> <width|height>
 *
 * So we need to normalise the comparison operator by reversing it.
 *
 * @param operator Comparison operator.
 * @returns The reversed comparison operator.
 */
const reverseComparisonOperator = (operator: ComparisonOperator): ComparisonOperator => {
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

  throw new SyntaxError(`Unexpected property '${property}' found when sorting media queries.`);
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

  throw new SyntaxError(
    `Unexpected comparison operator '${operator}' found when sorting media queries.`
  );
};

const getLengthInfo = (match: RegExpMatchArray): LengthInfo | undefined => {
  const length_ = match.groups?.length;
  const lengthUnit = match.groups?.lengthUnit;

  if (length_ === '0') {
    return { length: 0 };
  }

  if (typeof length_ !== 'string' || typeof lengthUnit !== 'string') {
    return undefined;
  }

  switch (lengthUnit as LengthUnit) {
    case 'ch':
    case 'ex':
      // https://drafts.csswg.org/css-values/#font-relative-lengths
      // We assume 1ch and 1ex are 0.5em, as we cannot rely on more specific information here.
      return { length: +length_ * 0.5 * REM_SIZE };
    case 'em':
    case 'rem':
      return { length: +length_ * REM_SIZE };
    case 'px':
      return { length: +length_ };
    default:
      // This should never happen
      throw new Error(`Unrecognized length unit ${lengthUnit}. This is a Compiled bug!`);
  }
};

const getBasicMatchInfo = (match: RegExpMatchArray): BasicMatchInfo | undefined => {
  if (!match.index) {
    return;
  }

  return { index: match.index, match: match[0] };
};

export const parseMinMaxSyntax = (match: RegExpMatchArray): ParsedAtRule | undefined => {
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

export const parseReversedRangeSyntax = (match: RegExpMatchArray): ParsedAtRule | undefined => {
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

export const parseRangeSyntax = (match: RegExpMatchArray): ParsedAtRule | undefined => {
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
