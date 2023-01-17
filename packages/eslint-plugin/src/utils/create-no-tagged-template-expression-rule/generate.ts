import type { Argument, Block, DeclarationValue } from './types';

const createKey = (key: string) => {
  if (/^\w+$/g.test(key)) {
    return key;
  }

  // Wrap the key in square brackets if the key includes a binding. i.e.`.foo ${BINDING_NAME} .bar`
  if (key.charAt(0) === '`' && key.charAt(key.length - 1) === '`') {
    return `[${key}]`;
  }

  // Wrap the key in quotes if it uses unsafe characters
  if (!key.includes('"')) {
    return `"${key}"`;
  }

  return `[\`${key}\`]`;
};

const addQuotes = (literal: string): string =>
  literal[0] === `"` ? `'${literal}'` : `"${literal}"`;

const createValue = (value: DeclarationValue) => {
  const { type } = value;
  if (type === 'expression') {
    return value.expression.trim();
  }

  const literal = value.value;
  return typeof literal === 'string' && literal[0] !== '`' ? addQuotes(literal) : literal;
};

const indent = (offset: number, level: number) => ' '.repeat(offset + level * 2);

const generateBlock = (blocks: Block[], offset: number, level: number): string => {
  let chars = '{' + '\n';
  for (const [i, block] of blocks.entries()) {
    chars += indent(offset, level + 1);

    switch (block.type) {
      case 'declaration': {
        chars += createKey(block.property) + ': ' + createValue(block.value);
        break;
      }

      case 'rule': {
        chars +=
          createKey(block.selector) +
          ': ' +
          generateArguments(block.declarations, offset, level + 1).trim();
        break;
      }

      default:
        break;
    }

    if (blocks.length > 1 && i < blocks.length - 1) {
      chars += ',';
      chars += '\n';
    }
  }

  chars += '\n' + indent(offset, level) + '}';

  return chars;
};

const generateArguments = (args: Argument[], offset: number, level: number): string => {
  let chars = '';
  if (level > 1 && args.length > 1) {
    chars += '[';
  }

  for (const [i, arg] of args.entries()) {
    switch (arg.type) {
      case 'block': {
        if (args.length === 1) {
          chars += generateBlock(arg.blocks, offset, level).trim();
        } else {
          chars += '\n';
          chars += indent(offset, level + 1);
          chars += generateBlock(arg.blocks, offset, level + 1).trim();
        }
        break;
      }

      case 'expression': {
        chars += '\n';
        chars += indent(offset, level + 1);
        chars += arg.expression;
        break;
      }

      default:
        break;
    }

    if (args.length > 1 && i < args.length - 1) {
      chars += ',';
    }
  }

  if (level > 1 && args.length > 1) {
    chars += '\n';
    chars += indent(offset, level);
    chars += ']';
  }

  return chars;
};

export const generate = (args: Argument[], offset: number, level = 0): string => {
  let chars = '';

  chars += '(';
  chars += generateArguments(args, offset, level);
  if (args.length > 1) {
    chars += '\n';
    chars += indent(offset, level);
  }
  chars += ')';

  return chars;
};
