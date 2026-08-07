---
'@compiled/react': patch
---

Fix runtime style bucketing for class names generated with `collisionResistantHash`.

`getStyleBucketName` located the pseudo-selector at a fixed offset, which only held for the
legacy 9-character atomic class name. With the collision-resistant hash (11 characters) every
pseudo-selector rule missed its bucket and fell through to the catch-all bucket, so `:hover`,
`:focus`, `:visited` and friends were no longer ordered against each other at runtime. The
pseudo-selector is now located relative to the opening bracket, so bucketing works for both
class name lengths.
