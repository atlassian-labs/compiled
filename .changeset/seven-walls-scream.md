---
'@compiled/react': patch
---

Changed the SSR check to be based on the presence of `document` instead of looking for Node processes.
