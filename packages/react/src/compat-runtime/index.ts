import * as React from 'react';

import { CC as BaseCC, CS as BaseCS, ax as baseAx, ac as baseAc, clearAcCache, ix as baseIx } from '../runtime';
import {
  configurePageRuntime,
  configureRuntime,
  getRuntimeConfig,
  reportRuntimeComparison,
  resetRuntimeConfig,
  runWithRuntimeConfig,
} from '../runtime/runtime-config.js';

export {
  clearAcCache,
  configurePageRuntime,
  configureRuntime,
  getRuntimeConfig,
  resetRuntimeConfig,
  runWithRuntimeConfig,
};
export type {
  CompiledRuntimeConfig,
  RuntimeComparePayload,
  RuntimeOutputMode,
} from '../runtime/runtime-config.js';

export const ax: typeof baseAx = (...args) => {
  const result = baseAx(...args);
  reportRuntimeComparison('ax', args, result);
  return result;
};

export const ac: typeof baseAc = (...args) => {
  const result = baseAc(...args);
  reportRuntimeComparison('ac', args, result);
  return result;
};

export const ix: typeof baseIx = (...args) => {
  const result = baseIx(...args);
  reportRuntimeComparison('ix', args, result);
  return result;
};

export const CC: typeof BaseCC = (props) => {
  reportRuntimeComparison('CC', [props], null);
  return React.createElement(BaseCC, props);
};

export const CS: typeof BaseCS = (props) => {
  const runtimeConfig = getRuntimeConfig();
  reportRuntimeComparison('CS', [props], null);

  if (runtimeConfig.enableRuntimeStyles === false) {
    return null;
  }

  return React.createElement(BaseCS, props);
};
