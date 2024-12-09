---
'@compiled/babel-plugin-strip-runtime': minor
'@compiled/parcel-optimizer': minor
'@compiled/webpack-loader': minor
'@compiled/css': minor
---

Possibly BREAKING: Default `sortShorthand` to be enabled during stylesheet extraction to match the config we have internally at Atlassian and our recommendation.

You can opt-out from this change by setting `sortShorthand: false` in several places, refer to https://compiledcssinjs.com/docs/shorthand and package-specific documentation.

This is only a breaking change if you expect `margin:0` to override `margin-top:8px` for example, which in other CSS-in-JS libraries may actually work, but in Compiled it's not guaranteed to work, so we forcibly sort it to guarantee the order in which these styles are applied.
