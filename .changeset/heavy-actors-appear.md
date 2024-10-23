---
'@compiled/css': patch
---

Fix sortShorthand when mixed with multi-property classes such as `._1jmq18uv{-webkit-text-decoration-color:initial;text-decoration-color:initial}` (previously, these broke sorting as they exited early).
