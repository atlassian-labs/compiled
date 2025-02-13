---
'@compiled/babel-plugin': patch
---

Stop checking if styles are cssMap if being used as `css={styles}`. This is to improve build performance.
