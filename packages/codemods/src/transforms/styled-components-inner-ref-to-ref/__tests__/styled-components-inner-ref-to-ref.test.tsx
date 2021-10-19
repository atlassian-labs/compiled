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
});
