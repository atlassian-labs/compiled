/* index.js generated by @compiled/babel-plugin v0.6.7 */

import { forwardRef } from 'react';
var _8 = '._19pk1ul9{margin-top:30px}';

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly)
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }
  return target;
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}

import { ax, ix, CC, CS } from '@compiled/react/runtime';
import { jsx as _jsx } from 'react/jsx-runtime';
import { jsxs as _jsxs } from 'react/jsx-runtime';
var _7 = '._19bvftgi{padding-left:8px}';
var _6 = '._n3tdftgi{padding-bottom:8px}';
var _5 = '._u5f3ftgi{padding-right:8px}';
var _4 = '._ca0qftgi{padding-top:8px}';
var _3 = '._19itlf8h{border:2px solid blue}';
var _2 = '._1wyb1ul9{font-size:30px}';
var _ = '._syaz13q2{color:blue}';
var Button = forwardRef(function (_ref, ref) {
  var _ref$as = _ref.as,
    C = _ref$as === void 0 ? 'button' : _ref$as,
    style = _ref.style,
    props = _objectWithoutProperties(_ref, ['as', 'style']);

  return /*#__PURE__*/ _jsxs(CC, {
    children: [
      /*#__PURE__*/ _jsx(CS, {
        children: [_, _2, _3, _4, _5, _6, _7],
      }),
      /*#__PURE__*/ _jsx(
        C,
        _objectSpread(
          _objectSpread({}, props),
          {},
          {
            style: style,
            ref: ref,
            className: ax([
              '_syaz13q2 _1wyb1ul9 _19itlf8h _ca0qftgi _u5f3ftgi _n3tdftgi _19bvftgi',
              props.className,
            ]),
          }
        )
      ),
    ],
  });
});
export default function BabelComponent(_ref2) {
  var children = _ref2.children;
  return /*#__PURE__*/ _jsxs(CC, {
    children: [
      /*#__PURE__*/ _jsx(CS, {
        children: [_8],
      }),
      /*#__PURE__*/ _jsx('div', {
        className: ax(['_19pk1ul9']),
        children: /*#__PURE__*/ _jsx(Button, {
          children: children,
        }),
      }),
    ],
  });
}
