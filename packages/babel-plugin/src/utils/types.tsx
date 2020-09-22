import * as t from '@babel/types';
import { Tag } from '../types';
import { CSSOutput } from './css-builders';

export interface BaseOpts {
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
}

export interface CompiledTemplateOpts extends BaseTemplateOpts {
  /**
   * Originating jsx node.
   */
  node: t.JSXElement;
}
