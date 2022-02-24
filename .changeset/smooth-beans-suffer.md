---
'@compiled/babel-plugin': patch
---

Fix conditional rules not generating the expected output:

- classes should be generated instead of CSS variables
- style inside a pseudo class ( eg : hover) or pseudo element ( eg :before) should be applied to related element
