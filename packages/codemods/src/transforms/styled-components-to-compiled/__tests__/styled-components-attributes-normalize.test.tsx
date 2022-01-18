import type {
  API,
  FileInfo,
  VariableDeclaration,
  VariableDeclarator,
  ArrowFunctionExpression,
  JSXElement,
} from 'jscodeshift';

import type { Transform } from '../../../plugins/types';
import transformer from '../styled-components-to-compiled';

jest.disableAutomock();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineInlineTest = require('jscodeshift/dist/testUtils').defineInlineTest;

describe('styled-components attributes normalize', () => {
  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
      import styled from 'styled-components';

      export const Input = styled.input.attrs(props => ({
        style: (props) => ({
          left: props.left,
          top: props.top,
        }),
      }))\`
        position: absolute;
      \`;
      `,
    `
      import { styled } from '@compiled/react';

      export const Input = styled.input\`
left: $\{props => props.left\};
top: $\{props => props.top\};
  position: absolute;
\`;
      `,
    'default style usage'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
      import styled from 'styled-components';

      export const Input = styled.input.attrs(props => ({
        style: (props) => ({
          left: \`$\{props.left}$\{props.top}px\`,
        }),
      }))\`
        position: absolute;
      \`;
      `,
    `
      import { styled } from '@compiled/react';

      export const Input = styled.input\`
left: $\{props => \`$\{props.left}$\{props.top}px\`\};
  position: absolute;
\`;
      `,
    'props argument used in one attribute'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export const Input = styled.input.attrs(props => ({
      style: ({ left, top }) => ({
        left: left,
        top: top,
      }),
    }))\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export const Input = styled.input\`
left: $\{(
  {
    left
  }
) => left\};
top: $\{(
  {
    top
  }
) => top\};
  position: absolute;
\`;
    `,
    'desctructed props in params'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export const Input = styled.input.attrs(props => ({
      style: ({ left, top }) => ({
        padding: \`$\{left}$\{top}px\`,
      }),
    }))\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export const Input = styled.input\`
padding: $\{(
  {
    left,
    top
  }
) => \`$\{left}$\{top}px\`};
  position: absolute;
\`;
    `,
    'desctructed multiple props used in one attribute'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export const Input = styled.input.attrs(props => ({
      style: ({ left }) => ({
        padding: \`$\{left}$\{left}px\`,
      }),
    }))\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export const Input = styled.input\`
padding: $\{(
  {
    left
  }
) => \`$\{left}$\{left}px\`};
  position: absolute;
\`;
    `,
    'destructed prop used several times'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export const Input = styled.input.attrs(props => ({
      style: ({ left, unused }) => ({
        left: left,
      }),
    }))\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export const Input = styled.input\`
left: $\{(
  {
    left
  }
) => left};
  position: absolute;
\`;
    `,
    'some props are unused in styles'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export const Input = styled.input.attrs(props => ({
      style: ({ left }) => ({
        left,
      }),
      id: 'test-id',
      onClick: this.onClick,
    }))\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    const InputStyles = styled.input\`
left: $\{(
  {
    left
  }
) => left};
  position: absolute;
\`;

    export const Input = props => <InputStyles id={'test-id'} onClick={this.onClick} {...props} />;
    `,
    'default attributes behaviour'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    const Input = styled.input.attrs(props => ({
      style: ({ left }) => ({
        left,
      }),
      id: 'test-id',
      onClick: this.onClick,
    }))\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    const InputStyles = styled.input\`
left: $\{(
  {
    left
  }
) => left};
  position: absolute;
\`;

    const Input = props => <InputStyles id={'test-id'} onClick={this.onClick} {...props} />;
    `,
    'component without export'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    const Input = styled.input.attrs(props => ({
      style: ({ left }) => ({
        left,
      }),
      id: 'test-id',
      onClick: this.onClick,
    }))\`
      position: absolute;
    \`;

    export default Input;
    `,
    `
    import { styled } from '@compiled/react';

    const InputStyles = styled.input\`
left: $\{(
  {
    left
  }
) => left};
  position: absolute;
\`;

    const Input = props => <InputStyles id={'test-id'} onClick={this.onClick} {...props} />;

    export default Input;
    `,
    'component with default export'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export const Input = styled.input.attrs(props => ({
      id: 'test-id',
      onClick: props.onClick,
    }))\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    const InputStyles = styled.input\`
      position: absolute;
    \`;

    export const Input = props => <InputStyles id={'test-id'} onClick={props.onClick} {...props} />;
    `,
    'attrs without style attribute'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export const Input = styled.input.attrs({
      style: props => ({
        left: props.left,
      }),
      id: 'test-id',
      onClick: this.onClick,
    })\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    const InputStyles = styled.input\`
left: $\{props => props.left};
  position: absolute;
\`;

    export const Input = props => <InputStyles id={'test-id'} onClick={this.onClick} {...props} />;
    `,
    'attrs with object expression as an argument'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export default styled.input.attrs({
      style: props => ({
        left: props.left,
      }),
    })\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    export default styled.input\`
left: $\{props => props.left};
  position: absolute;
\`;
    `,
    'should export default component'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export default styled.input.attrs({
      style: props => ({
        left: props.left,
      }),
      id: 'test-id',
      onClick: this.onClick,
    })\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    const ComposedComponentStyles = styled.input\`
left: $\{props => props.left};
  position: absolute;
\`;

    export default props => <ComposedComponentStyles id={'test-id'} onClick={this.onClick} {...props} />;
    `,
    'should export default component wrapper'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [],
    },
    `
    import styled from 'styled-components';

    export default () => styled.input.attrs({
      style: props => ({
        left: props.left,
      }),
      id: 'test-id',
      onClick: this.onClick,
    })\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    const ComposedComponentStyles = styled.input\`
left: $\{props => props.left};
  position: absolute;
\`;

    export default () => props => <ComposedComponentStyles id={'test-id'} onClick={this.onClick} {...props} />;
    `,
    'should export default wrapped component with a wrapper'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [
        {
          create: (_: FileInfo, { jscodeshift: j }: API) => ({
            transform: {
              buildAttributes: ({ currentNode }) => {
                const declaration = currentNode.value as VariableDeclaration;
                const declarator = declaration.declarations[0] as VariableDeclarator;
                const declarationInit = declarator.init as ArrowFunctionExpression;
                const oldComponentBody = declarationInit.body as JSXElement;

                declarationInit.body = j.conditionalExpression(
                  j.callExpression(j.identifier('isFeatureFlagEnabled'), []),
                  oldComponentBody,
                  j.identifier('null')
                );

                return currentNode;
              },
            } as Transform,
          }),
        },
      ],
    },
    `
    import styled from 'styled-components';

    export const Input = styled.input.attrs({
      style: props => ({
        left: props.left,
      }),
      id: 'test-id',
      onClick: this.onClick,
    })\`
      position: absolute;
    \`;
    `,
    `
    import { styled } from '@compiled/react';

    const InputStyles = styled.input\`
left: $\{props => props.left};
  position: absolute;
\`;

    export const Input = props => isFeatureFlagEnabled() ? <InputStyles id={'test-id'} onClick={this.onClick} {...props} /> : null;
    `,
    'it should use the buildAttributes from the plugin'
  );
});
