import { Prompt } from 'enquirer';

declare module 'enquirer' {
  export class AutoComplete extends Prompt {
    constructor(options?: any);
    render(): void;
    run(): Promise<any>;
  }

  export class Form extends Prompt {
    constructor(options?: any);
    render(): void;
    run(): Promise<any>;
  }
  export class List extends Prompt {
    constructor(options?: any);
    render(): void;
    run(): Promise<any>;
  }
}
