import type { API, FileInfo } from 'jscodeshift';

import type { ProgramVisitorContext } from '../../../plugins/types';
import transformer from '../styled-components-inner-ref-to-ref';

jest.disableAutomock();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineInlineTest = require('jscodeshift/dist/testUtils').defineInlineTest;

describe('styled-components-inner-ref-to-ref transformer', () => {
  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    '<div innerRef={ref => this.ref = ref} />',
    '<div ref={ref => this.ref = ref} />',
    'it transforms default innerRef attribute into ref with inline function'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    '<div className="simple-class" innerRef={ref => this.ref = ref} id="testId" />',
    '<div className="simple-class" ref={ref => this.ref = ref} id="testId" />',
    'it transforms default innerRef attribute into ref with other attributes'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    '<div innerRef={this.setRef} />',
    '<div ref={this.setRef} />',
    'it transforms default innerRef attribute into ref with passed function'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    { plugins: [] },
    '<div innerRef={this.setRef}><span innerRef={this.setFirstSpanRef} /><span innerRef={this.setSecondSpanRef} /></div>',
    '<div ref={this.setRef}><span ref={this.setFirstSpanRef} /><span ref={this.setSecondSpanRef} /></div>',
    'it transforms default innerRef attribute into ref for multiple nodes'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [
        {
          create: (_: FileInfo, { jscodeshift: j }: API) => ({
            transform: {
              buildRefAttribute: () =>
                j.jsxAttribute(
                  j.jsxIdentifier('customRef'),
                  j.jsxExpressionContainer(
                    j.memberExpression(j.thisExpression(), j.identifier('setCustomRef'))
                  )
                ),
            },
          }),
        },
      ],
    },
    '<div innerRef={this.setRef} />',
    '<div customRef={this.setCustomRef} />',
    'it should use the buildRefAttribute from the plugin'
  );

  defineInlineTest(
    { default: transformer, parser: 'tsx' },
    {
      plugins: [
        {
          create: (_: FileInfo, { jscodeshift: j }: API) => ({
            visitor: {
              program: ({ program }: ProgramVisitorContext<void>) => {
                const node = j(program).find(j.JSXOpeningElement).paths()[0];

                node.value.attributes?.push(
                  j.jsxAttribute(j.jsxIdentifier('customId'), j.literal('custom-id-val'))
                );
              },
            },
          }),
        },
      ],
    },
    '<div innerRef={this.setRef} />',
    "<div ref={this.setRef} customId='custom-id-val' />",
    'it should use the program visitor from the plugin'
  );
});
