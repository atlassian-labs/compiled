/**
 * Options the codemod preset officially takes.
 */
export interface CodemodOptions {
  path?: string;
  parser?: string;
  extensions?: string;
  ignorePattern?: string;
}

/**
 * A choice for the enquirer form.
 */
export interface Choice<TName = string> {
  name: TName;
  message: string;
  value?: string;
  hint?: string;
}
