import type { SourceCode } from 'eslint';
import type * as ESTree from 'estree';

import type { Argument, Block, DeclarationValue, Expression } from './types';

type ExpressionState = {
  expression: string;
  pos: number;
};

const getArguments = (
  chars: string,
  expressions: ExpressionState[] = []
): (Expression | Block)[] => {
  if (!chars.trim().length && expressions) {
    return expressions.map(({ expression }) => ({
      type: 'expression',
      expression,
    }));
  }

  const args: (Expression | Block)[] = [];

  if (!chars.includes(':')) {
    return args;
  }

  const [property, value] = chars.split(':');

  // Extract any expressions listed before the property that were not delimited by a ;
  if (expressions.length) {
    const lastPropertyRe = /[\w-]+(?![\s\S]*[\w-]+)/g;
    const prop = lastPropertyRe.exec(property);
    if (prop) {
      let i = 0;
      while (expressions[i] && expressions[i].pos < prop.index) {
        args.push({
          type: 'expression',
          expression: expressions[i].expression,
        });
        i++;
      }
      // Remove any expressions that have been added as an arg as they are not part of the declaration
      expressions = expressions.slice(i);
    }
  }

  const getValue = (): DeclarationValue => {
    if (!value.trim().length && expressions.length) {
      return {
        type: 'expression',
        expression: expressions.map((e) => e.expression).join(''),
      };
    }

    if (expressions.length) {
      // When there are expressions in the value, insert the expressions and wrap the value in a template literal
      let val = chars;
      let offset = 1;
      for (const { expression, pos } of expressions) {
        const interpolation = '${' + expression + '}';
        val = val.substring(0, pos + offset) + interpolation + val.substring(pos + offset);
        offset += interpolation.length;
      }

      return {
        type: 'literal',
        value: '`' + val.replace(property + ':', '').trim() + '`',
      };
    }

    return {
      type: 'literal',
      value: isNaN(Number(value)) ? value.trim() : parseFloat(value),
    };
  };

  args.push({
    type: 'declaration',
    // Make the property camelCase
    property: property.trim().replace(/-[a-z]/g, (match) => match[1].toUpperCase()),
    value: getValue(),
  });

  return args;
};

const getSelectorValue = (
  chars: string,
  expressions: { pos: number; expression: string }[]
): string => {
  // If no variable, returns chars immediately.
  // i.e. `.foo { color: red }` returns '.foo'
  if (expressions.length === 0) {
    return chars.trim();
  }

  let val = chars;
  let offset = 1;

  for (const { expression, pos } of expressions) {
    const interpolation = '${' + expression + '}';
    val = val.substring(0, pos + offset) + interpolation + val.substring(pos + offset);
    offset += interpolation.length;
  }

  // For simplicity, use template literals even if the whole selector is a variable
  // i.e. the output of `${VAR} { color: red }` is { [`${VAR}`]: { color: "red" } }
  return '`' + val.trim() + '`';
};

type Current = {
  parent: Current | undefined;
  args: Argument[];
};

type State = {
  chars: string;
  current: Current;
  expressions: ExpressionState[];
};

export const toArguments = (source: SourceCode, template: ESTree.TemplateLiteral): Argument[] => {
  const args: Argument[] = [];
  const state: State = {
    chars: '',
    current: {
      parent: undefined,
      args,
    },
    expressions: [],
  };

  const addArgument = (argument: Expression | Block) => {
    const { args } = state.current;
    if (argument.type === 'expression') {
      if (argument.expression.length) {
        args.push(argument);
      }
      return;
    }

    const lastArg = args[state.current.args.length - 1];
    if (lastArg?.type === 'block') {
      lastArg.blocks.push(argument);
    } else {
      args.push({
        type: 'block',
        blocks: [argument],
      });
    }
  };

  const addArguments = () => {
    const args = getArguments(state.chars, state.expressions);
    for (const arg of args) {
      addArgument(arg);
    }
  };

  for (const [i, quasi] of template.quasis.entries()) {
    // Deal with selectors across multiple lines
    const styleTemplateElement = quasi.value.raw
      .replace(/(\r\n|\n|\r)/gm, ' ')
      .replace(/\s+/g, ' ');

    for (const char of styleTemplateElement) {
      switch (char) {
        case '{': {
          const declarations: Argument[] = [];

          addArgument({
            type: 'rule',
            selector: getSelectorValue(state.chars, state.expressions),
            declarations,
          });

          state.chars = '';
          state.current = { parent: state.current, args: declarations };
          state.expressions = [];
          break;
        }

        case '}': {
          // Add any leftover arguments that were not delimited
          addArguments();

          state.chars = '';
          state.current = state.current.parent!;
          state.expressions = [];

          break;
        }

        case ';': {
          addArguments();

          state.chars = '';
          state.expressions = [];
          break;
        }

        default:
          state.chars += char;
          break;
      }
    }

    if (i < template.expressions.length) {
      state.expressions.push({
        pos: state.chars.length - 1,
        expression: source.getText(template.expressions[i]),
      });
    }
  }

  // Add any leftover arguments that were not delimited
  addArguments();

  return args;
};
