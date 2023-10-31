import { typeScriptTester as tester } from '../../../test-utils';
import { noSuppressXCSS } from '../index';

tester.run('no-styled-tagged-template-expression', noSuppressXCSS, {
  valid: [],
  invalid: [],
});
