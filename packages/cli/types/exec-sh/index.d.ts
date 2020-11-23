declare module 'exec-sh' {
  import { SpawnOptions } from 'child_process';

  export interface ExecSh {
    (
      commands: string | string[],
      options: SpawnOptions,
      errorCallback: (error?: Error) => void
    ): void;
  }

  const execSh: ExecSh;

  export const promise: (
    commands: string | string[],
    options?: SpawnOptions
  ) => Promise<{
    stdout: string | null;
    stderr: string | null;
  }>;

  export default execSh;
}
