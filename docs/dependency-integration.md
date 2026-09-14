# Dependency integration triage

`node scripts/bcl.cjs dependency-scan /path/to/local/product` inventories literal
Buildroot `*_VERSION`/`*_SITE` assignments, npm v2/v3 lockfile package entries and
Git index submodule pins. It reads metadata without executing upstream scripts.
Manifest hashes preserve provenance. Computed versions stay unresolved. Conditional
Make branches are not evaluated: review the selected product configuration.
This is a local inventory, not an automatic upstream fix search or recursive crawler.

`node scripts/bcl.cjs integration-check manifest.json` checks a reviewed fix against
full Git commit IDs in a complete local dependency repository:

```json
{
  "schemaVersion": 1,
  "repository": "/path/to/dependency",
  "productPin": "<40-character current dependency commit>",
  "fixCommit": "<40-character reviewed upstream fix commit>",
  "candidateCommit": "<40-character proposed dependency commit>"
}
```

`READY_TO_INTEGRATE` means the supplied fix is absent from the current pin's ancestry,
contained in the candidate, and the candidate descends from the current pin.
`ALREADY_INTEGRATED` means the current pin contains the fix commit.
Other ancestry combinations return `NEEDS_REVIEW`. Missing objects and shallow
history fail instead of guessing. npm release numbers must first be resolved to
reviewed source revisions; semver comparison does not establish fix inclusion.

These are triage statuses, separate from executable case readiness and publication
qualification. A reviewed fix can later be reverted; ancestry alone is not semantic
proof. The caller must bind the product pin to the correct manifest/configuration.

Next: automatically bind product revisions and dependency manifests, compare two
product versions, connect dependency and product red/green evidence, import cited
measurements separately from BCL-run results, and persist source caches across runs.
Thingino's reported memory measurements are not imported or independently verified
by this change. Existing external-result import and batch reuse remain unchanged.
