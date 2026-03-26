import * as React from 'react';

import {
  CC as BaseCC,
  CS as BaseCS,
  ax as baseAx,
  ac as baseAc,
  clearAcCache,
  ix as baseIx,
} from '../runtime';
import {
  configurePageRuntime,
  configureRuntime,
  getRuntimeConfig,
  reportRuntimeComparison,
  resetRuntimeConfig,
  runWithRuntimeConfig,
} from '../runtime/runtime-config.js';
import type { RuntimeCompareMismatch } from '../runtime/runtime-config.js';

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
  RuntimeCompareMismatch,
  RuntimeCompareMode,
  RuntimeComparePayload,
  RuntimeMismatchKind,
  RuntimeOutputMode,
} from '../runtime/runtime-config.js';

type CompareExecutionResult<T> = {
  result: T;
  shadowResult?: unknown;
  mismatches: RuntimeCompareMismatch[];
};

const ATOMIC_GROUP_LENGTH = 5;

const normalizeComparableResult = (value: unknown): unknown => {
  if (value == null) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (
    typeof value === 'object' &&
    typeof (value as { toString?: () => string }).toString === 'function'
  ) {
    return (value as { toString: () => string }).toString();
  }

  return value;
};

const stylexLikeAx = (classNames: (string | undefined | null | false)[]): string | undefined => {
  const ordered: string[] = [];
  const seenIndexes = new Map<string, number>();

  for (const value of classNames) {
    if (!value) {
      continue;
    }

    for (const className of value.split(' ')) {
      const key = className.startsWith('_') ? className.slice(0, ATOMIC_GROUP_LENGTH) : className;
      const existingIndex = seenIndexes.get(key);

      if (existingIndex !== undefined) {
        ordered[existingIndex] = className;
        continue;
      }

      seenIndexes.set(key, ordered.length);
      ordered.push(className);
    }
  }

  return ordered.length ? ordered.join(' ') : undefined;
};

const compareShadowResult = <T>(
  operation: string,
  args: unknown[],
  compiledResult: T,
  shadowExecutor: (() => unknown) | undefined
): CompareExecutionResult<T> => {
  const config = getRuntimeConfig();
  const mismatches: RuntimeCompareMismatch[] = [];

  if (config.compareMode !== 'shadow') {
    return { result: compiledResult, mismatches };
  }

  if (!shadowExecutor) {
    mismatches.push({
      kind: 'shadow-unsupported',
      message: `No shadow executor is available for ${operation}.`,
    });

    return { result: compiledResult, mismatches };
  }

  try {
    const shadowResult = shadowExecutor();
    const normalizedCompiled = normalizeComparableResult(compiledResult);
    const normalizedShadow = normalizeComparableResult(shadowResult);

    if (normalizedCompiled !== normalizedShadow) {
      mismatches.push({
        kind: 'result-mismatch',
        message: `Compiled and shadow ${operation} results differ.`,
        details: {
          compiledResult: normalizedCompiled,
          shadowResult: normalizedShadow,
        },
      });
    }

    return {
      result: compiledResult,
      shadowResult,
      mismatches,
    };
  } catch (error) {
    mismatches.push({
      kind: 'shadow-error',
      message: `Shadow execution for ${operation} failed.`,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return { result: compiledResult, mismatches };
  }
};

const reportComparison = <T>(
  operation: string,
  args: unknown[],
  execution: CompareExecutionResult<T>
): T => {
  reportRuntimeComparison({
    operation,
    args,
    result: execution.result,
    shadowResult: execution.shadowResult,
    mismatches: execution.mismatches,
    matched: execution.mismatches.length === 0,
  });

  return execution.result;
};

export const ax: typeof baseAx = (...args) =>
  reportComparison(
    'ax',
    args,
    compareShadowResult('ax', args, baseAx(...args), () => stylexLikeAx(args[0]))
  );

export const ac: typeof baseAc = (...args) =>
  reportComparison('ac', args, compareShadowResult('ac', args, baseAc(...args), undefined));

export const ix: typeof baseIx = (...args) =>
  reportComparison(
    'ix',
    args,
    compareShadowResult('ix', args, baseIx(...args), () => baseIx(...args))
  );

export const CC: typeof BaseCC = (props) => {
  reportComparison('CC', [props], compareShadowResult('CC', [props], null, undefined));
  return React.createElement(BaseCC, props);
};

export const CS: typeof BaseCS = (props) => {
  const runtimeConfig = getRuntimeConfig();
  const mismatches: RuntimeCompareMismatch[] = [];

  if (runtimeConfig.compareMode === 'shadow' && runtimeConfig.enableRuntimeStyles === false) {
    mismatches.push({
      kind: 'style-emission-skipped',
      message: 'Compat runtime style emission is disabled; no primary style output was produced.',
    });
  }

  reportRuntimeComparison({
    operation: 'CS',
    args: [props],
    result: runtimeConfig.enableRuntimeStyles === false ? null : null,
    shadowResult: runtimeConfig.compareMode === 'shadow' ? null : undefined,
    mismatches,
    matched: mismatches.length === 0,
  });

  if (runtimeConfig.enableRuntimeStyles === false) {
    return null;
  }

  return React.createElement(BaseCS, props);
};
