import { createElement, ElementType, ReactNode } from 'react';
import './types';
import { name as packageName } from '../../package.json';

const IS_CSS_FREEDOM_COMPILED = false;

/**
 * Will only work in conjuntion with the babel plugin.
 *
 * At compile time will convert static content:
 * <div css={{ fontSize: '20px' }} />
 *
 * To:
 * <React.Fragment>
 *   <style data-css-freedom>.a { font-size: 20px; }</style>
 *   <div className="a" />
 * </React.Fragment>
 *
 * At compile time will convert dynamic content:
 * <div css={{ fontSize: '20px', color: props.color }} />
 *
 * To:
 * <React.Fragment>
 *   <style data-css-freedom>.a { font-size: 20px; color: --ak-color-aASDsf }</style>
 *   <div className="a" style={{ '--ak-color-aASDsf': props.color }} />
 * </React.Fragment>
 *
 * While ensuring any style & className props set are still respected.
 *
 * @param type
 * @param props
 * @param children
 */
export default function<P extends {}>(type: ElementType<P>, props: P, ...children: ReactNode[]) {
  if (process.env.NODE_ENV !== 'production' && !IS_CSS_FREEDOM_COMPILED) {
    throw new Error(`${packageName}

You need to apply the typescript transformer to use this!
You can apply it from \`${packageName}/transformer\`.`);
  }

  return createElement(type, props, ...children);
}
