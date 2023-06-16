export type {
  BuildImportContext,
  CodemodPlugin,
  CodemodPluginInstance,
  ProgramVisitorContext,
  Transform,
  Visitor,
} from './plugins/types';

import emotionToCompiled from './transforms/emotion-to-compiled';
import styledComponentsInnerRefToRef from './transforms/styled-components-inner-ref-to-ref';
import styledComponentsToCompiled from './transforms/styled-components-to-compiled';

export { emotionToCompiled, styledComponentsToCompiled, styledComponentsInnerRefToRef };

export default {
  presets: {
    'emotion-to-compiled': emotionToCompiled,
    'styled-components-to-compiled': styledComponentsToCompiled,
    'styled-components-inner-ref-to-ref': styledComponentsInnerRefToRef,
  },
};
