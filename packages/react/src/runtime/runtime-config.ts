export type RuntimeOutputMode = 'compiled' | 'stylex';
export type RuntimeCompareMode = 'off' | 'shadow';
export type RuntimeMismatchKind =
  | 'result-mismatch'
  | 'style-emission-skipped'
  | 'shadow-unsupported'
  | 'shadow-error';

export interface RuntimeCompareMismatch {
  kind: RuntimeMismatchKind;
  message: string;
  details?: Record<string, unknown>;
}

export interface RuntimeComparePayload {
  operation: string;
  args: unknown[];
  result: unknown;
  mode: RuntimeOutputMode;
  flags: CompiledRuntimeConfig;
  compareMode: RuntimeCompareMode;
  shadowResult?: unknown;
  mismatches: RuntimeCompareMismatch[];
  matched: boolean;
}

export interface CompiledRuntimeConfig {
  mode?: RuntimeOutputMode;
  enableRuntimeStyles?: boolean;
  compareMode?: RuntimeCompareMode;
  compare?: (payload: RuntimeComparePayload) => void;
}

const GLOBAL_CONFIG_KEY = '__COMPILED_RUNTIME_CONFIG__';

const defaultConfig: Required<
  Pick<CompiledRuntimeConfig, 'mode' | 'enableRuntimeStyles' | 'compareMode'>
> = {
  mode: 'compiled',
  enableRuntimeStyles: true,
  compareMode: 'off',
};

type RuntimeConfigTarget = Record<string, unknown>;

const getGlobalTarget = (): RuntimeConfigTarget | undefined => {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }

  return globalThis as RuntimeConfigTarget;
};

const normalizeConfig = (config?: CompiledRuntimeConfig): CompiledRuntimeConfig => ({
  ...config,
});

export const getRuntimeConfig = (target?: RuntimeConfigTarget): CompiledRuntimeConfig => {
  const activeTarget = target ?? getGlobalTarget();
  const configured = (activeTarget?.[GLOBAL_CONFIG_KEY] as CompiledRuntimeConfig | undefined) ?? {};

  return {
    ...defaultConfig,
    ...normalizeConfig(configured),
  };
};

export const configureRuntime = (config: CompiledRuntimeConfig): CompiledRuntimeConfig => {
  const target = getGlobalTarget();
  const next = {
    ...getRuntimeConfig(target),
    ...normalizeConfig(config),
  };

  if (target) {
    target[GLOBAL_CONFIG_KEY] = next;
  }

  return next;
};

export const configurePageRuntime = (
  target: RuntimeConfigTarget,
  config: CompiledRuntimeConfig
): CompiledRuntimeConfig => {
  const next = {
    ...getRuntimeConfig(target),
    ...normalizeConfig(config),
  };

  target[GLOBAL_CONFIG_KEY] = next;
  return next;
};

export const resetRuntimeConfig = (target?: RuntimeConfigTarget): CompiledRuntimeConfig => {
  const activeTarget = target ?? getGlobalTarget();

  if (activeTarget) {
    delete activeTarget[GLOBAL_CONFIG_KEY];
  }

  return getRuntimeConfig(activeTarget);
};

export const runWithRuntimeConfig = <T>(config: CompiledRuntimeConfig, callback: () => T): T => {
  const target = getGlobalTarget();
  const previous = getRuntimeConfig(target);

  configureRuntime(config);

  try {
    return callback();
  } finally {
    if (target) {
      target[GLOBAL_CONFIG_KEY] = previous;
    }
  }
};

export const reportRuntimeComparison = (
  payload: Omit<RuntimeComparePayload, 'mode' | 'flags' | 'compareMode'>,
  target?: RuntimeConfigTarget
): void => {
  const config = getRuntimeConfig(target);

  config.compare?.({
    ...payload,
    mode: config.mode ?? 'compiled',
    flags: config,
    compareMode: config.compareMode ?? 'off',
  });
};
