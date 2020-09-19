import * as t from '@babel/types';
import { Scope, NodePath } from '@babel/traverse';
import { PluginOptions, Tag } from '../types';
import { CSSOutput } from './css-builders';

export interface BaseOpts extends PluginOptions {
  /**
   * CSS data that will be integrated into the output AST.
   */
  cssOutput: CSSOutput;
}

export interface StyledOpts extends BaseOpts {
  /**
   * Tag of the Styled Component,
   * for example `"div"` or user defined component.
   */
  tag: Tag;

  /**
   * Babel path used for traversing inner nodes.
   */
  parentPath: NodePath;

  /**
   * Babel scope used for traversing inner nodes.
   */
  scope: Scope;
}

export interface CompiledOpts extends BaseOpts {
  /**
   * Originating jsx node.
   */
  node: t.JSXElement;
}

export interface BaseTemplateOpts {
  /**
   * Adds a nonce onto the `CS` component.
   */
  nonce?: string;

  /**
   * CSS blocks to be passed to the `CS` component.
   */
  css: string[];
}

export interface StyledTemplateOpts extends BaseTemplateOpts {
  /**
   * Class to be used for the CSS selector.
   */
  className: string;

  /**
   * Tag for the Styled Component, for example "div" or user defined component.
   */
  tag: Tag;

  /**
   * CSS variables to be passed to the `style` prop.
   */
  variables: CSSOutput['variables'];

  /**
   * Babel path used for traversing inner nodes.
   */
  parentPath: NodePath;

  /**
   * Babel scope used for traversing inner nodes.
   */
  scope: Scope;
}

export interface CompiledTemplateOpts extends BaseTemplateOpts {
  /**
   * Originating jsx node.
   */
  jsxNode: t.JSXElement;
}
