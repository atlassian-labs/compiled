---
'@compiled/babel-plugin': patch
---

Fix handling of `content` property.

- The value of the `content` property will no longer automatically have quotes erroneously added around it, if the value is one of `open-quote`, `counter(...)`, `url(...)`, `inherit`, `none`, and so on.
- The full regex used to check is as follows: `/^([A-Za-z\-]+\([^]*|[^]*-quote|inherit|initial|none|normal|revert|unset)(\s|$)/`
