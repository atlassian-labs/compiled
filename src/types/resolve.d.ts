import resolve from 'resolve';

declare module 'resolve' {
  export interface SyncOpts extends resolve.Opts {
    /** function to synchronously test whether a directory exists */
    isDirectory?: (directory: string) => boolean;
  }
}
