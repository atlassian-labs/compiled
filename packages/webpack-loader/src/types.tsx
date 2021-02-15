import { createStore } from './sheet-store';

export type SheetStore = ReturnType<typeof createStore>;

export interface LoaderOptions {
  extract?: boolean;
  importReact?: boolean;
  nonce?: string;
  sheetStore?: SheetStore;
}
