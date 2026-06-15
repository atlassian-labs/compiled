---
'@compiled/react': patch
---

Improve TypeScript type-checking performance of the `xcss` prop / strict API by mapping
`XCSSValue` over only the allowed properties (via a key-remapping `as` clause) instead of
mapping over all ~490 `StrictCSSProperties` and discarding the rest with `never`.

`XCSSValue` is instantiated once for the base properties plus once per allowed pseudo and
once per allowed media query, so the original all-properties map was a large, repeated cost
at every `xcss` usage site. The new form keeps only the allowed keys, with an explicit
blocking half (`{ [Q in Exclude...]?: never }`) so disallowed/excess properties remain type
violations — type safety is unchanged.

Impact (measured against Atlassian Design System `@atlaskit/css` + `@atlaskit/primitives`):
narrow `xcss` declarations drop type instantiations substantially, and the wide
`StrictXCSSProp<XCSSAllProperties, XCSSAllPseudos>` used by primitives like `Box` goes from
producing a `TS2589` "type instantiation is excessively deep" error to type-checking
cleanly, with a ~74% reduction in instantiated types and check time on that import path.
Wide/all-property consumers see a negligible (<1%) change.
