import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { State } from '../types';

/**
 * Takes a class name component and transforms it into a compiled component.
 * This method will traverse the AST twice,
 * once to replace all calls to `css`,
 * and another to replace `style` usage.
 *
 * `<ClassNames>{}</ClassNames>`
 *
 * @param path Babel path - expects to be a JSX opening element.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
export const visitClassNamesPath = (_: NodePath<t.JSXOpeningElement>, __: State) => {};
