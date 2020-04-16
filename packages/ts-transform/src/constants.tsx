import * as ts from 'typescript';

// Strings
export const CSS_VARIABLE_PREFIX = 'var';

// Props
export const CSS_PROP_NAME = 'css';
export const REF_PROP_NAME = 'ref';
export const HASH_PROP_NAME = 'hash';
export const STYLE_PROP_NAME = 'style';
export const CLASSNAME_PROP_NAME = 'className';

// Identifiers
export const REACT_PACKAGE_NAME = 'react';
export const COMMON_JS_COMPILED_IMPORT = 'css_in_js_1';
export const REACT_DEFAULT_IMPORT = 'React';
export const REACT_COMMON_JS_IMPORT = 'react_2';
export const STYLED_AS_PROP_NAME = 'as';
export const STYLED_AS_USAGE_NAME = 'C';

// Named imports
export const FORWARD_REF_IMPORT = 'forwardRef';
export const CLASS_NAMES_IMPORT = 'ClassNames';
export const STYLED_COMPONENT_IMPORT = 'styled';
export const COMPILED_STYLE_COMPONENT_NAME = 'Style';
export const COMMON_JS_DEFAULT_IMPORT = 'default';

export const getReactDefaultImportName = (context: ts.TransformationContext) => {
  return context.getCompilerOptions().module === ts.ModuleKind.CommonJS
    ? (ts.createPropertyAccess(
        ts.createIdentifier(REACT_COMMON_JS_IMPORT),
        ts.createIdentifier(COMMON_JS_DEFAULT_IMPORT)
      ) as ts.JsxTagNamePropertyAccess)
    : ts.createIdentifier(REACT_DEFAULT_IMPORT);
};

export const getStyleComponentImport = (context: ts.TransformationContext) =>
  context.getCompilerOptions().module === ts.ModuleKind.CommonJS
    ? (ts.createPropertyAccess(
        ts.createIdentifier(COMMON_JS_COMPILED_IMPORT),
        ts.createIdentifier(COMPILED_STYLE_COMPONENT_NAME)
      ) as ts.JsxTagNamePropertyAccess)
    : ts.createIdentifier(COMPILED_STYLE_COMPONENT_NAME);
