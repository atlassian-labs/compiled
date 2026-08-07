---
'@compiled/react': patch
---

Fix a compatibility regression in runtime style bucketing for compound pseudo-selectors.

`1.0.1` located the pseudo via `lastIndexOf(':')` so collision-resistant (11-char) hashes
bucketed correctly, but that also moved compound selectors like `:visited:hover` /
`:hover:focus` out of the catch-all bucket into `h` / `f` / etc. Bucketing now finds the
_first_ colon after a length-aware atomic class (9 or 11 chars) and keeps the existing
colon+4 → `pseudosMap` mangling, so simple `:hover` / `:visited` / … still map for both
lengths while compounds stay catch-all — matching `1.0.0` for legacy hashes.
