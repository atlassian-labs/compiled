---
'@compiled/react': minor
---

Update the `ax()` runtime to extract the atomic group key using length-based slicing
(`className.length - 4`) instead of a hardcoded offset.

This makes `ax()` forward-compatible with longer atomic class names: it now correctly
deduplicates both the current 9-char format (`_` + 4-char group + 4-char value) and the
upcoming 11-char format (`_` + 6-char group + 4-char value). Because the two formats
produce group keys of different lengths, they are structurally disjoint and never falsely
deduplicate each other — so old and new class names can safely coexist on the same element
during a migration. Behaviour for existing 9-char class names is unchanged.
