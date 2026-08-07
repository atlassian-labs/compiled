---
'@compiled/react': patch
---

Fix a compatibility regression in runtime style bucketing for compound pseudo-selectors.

`1.0.1` located the pseudo via `lastIndexOf(':')` so collision-resistant (11-char) hashes
bucketed correctly, but that also moved compound selectors like `:visited:hover` /
`:hover:focus` out of the catch-all bucket into `h` / `f` / etc. Bucketing now detects the
atomic class width from the boundary character (index 10 for the legacy 9-char hash, index
12 for the 11-char collision-resistant hash) and reads the pseudo relative to it, keeping
the existing colon+4 → `pseudosMap` mangling. Simple `:hover` / `:visited` / … still map for
both hash lengths, while compounds stay in the catch-all bucket — matching `1.0.0` for
legacy hashes.
