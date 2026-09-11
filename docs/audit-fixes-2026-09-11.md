# Audit fixes and validation — 2026-09-11

Implementation: [audit fixes](https://github.com/iibaranov-IG/broadcast-control-lab/commit/ae8464e8afc5b75a579a8a2655210c87370dc3c0), followed by [runtime corrections](https://github.com/iibaranov-IG/broadcast-control-lab/commit/fc9e71aad1f00947e7aab9202ea3aee3866458fe).

## Findings addressed

| Finding | Change |
| --- | --- |
| Contract-only cases appeared ready | 22 passports are now `diagnostic`; c64cast-368 uses real upstream red/green and full unittest discovery. |
| Triage did not gate later stages | Hash-bound, source-bound selection is required at scaffold, upstream execution and publication. Existing-PR revalidation is explicit and cannot authorize a new PR. |
| Tested tree could differ from published tree | Complete nonignored candidate changes must be declared; publication compares the constructed Git tree with the tested tree. |
| Entirely skipped CTest suites could qualify | Skipped/not-run summaries are counted; empty and entirely skipped suites fail qualification. |
| Low-score candidates remained queue-eligible | Scores below 70 have no executable queue key; reserve and skip classes remain distinct. |
| Failed acquisition could leave a reusable partial checkout | Acquisition uses a temporary cache entry and atomic completion; failed entries are removed before retry. |
| One failed batch case blocked passing peers | A completed mixed batch permits only an individually passing case, subject to all selection and evidence checks. Incomplete/cancelled batches are rejected. |
| PR head changes left evidence appearing current | Changed heads mark bound evidence and prior hardware results stale; repeated attachment does not clear that state. |

## Observed verification

[Successful complete CI run](https://github.com/iibaranov-IG/broadcast-control-lab/actions/runs/34614442198) on commit `fc9e71aad1f00947e7aab9202ea3aee3866458fe`:

- 75 infrastructure tests passed, none skipped.
- All 22 legacy diagnostic case jobs passed.
- c64cast-368 baseline focused regression produced the required exit 1 and defect diagnostic.
- The unchanged focused regression passed after the production patch, exit 0.
- Full upstream discovery reported 5,669 tests, 24 skipped, successful exit: 5,645 non-skipped tests.
- Preparation and execution ran in the BCL offline container, after audited dependency acquisition.

[c64cast evidence bundle](https://github.com/iibaranov-IG/broadcast-control-lab/actions/runs/34614442198/artifacts/10269672760), ZIP SHA-256: `d13a2ae2d34bb1616e70d1746baa3683e505751cab3722e0ffae191d9ad69206`.

The first strict run found environment defects: absent installed project metadata produced `0+unknown`, and `HOME=/tmp` conflicted with upstream filesystem-sandbox assumptions. The correction installs the project offline using the pinned build backend and provides an isolated home outside temporary roots. No upstream tests were removed or weakened.

## Remaining limits

The other 22 cases still need individual upstream migrations; their diagnostic success does not qualify publication. Shared preparation is covered by infrastructure tests, not a completed nine-repair production benchmark. Mixed-batch publication logic is regression-tested; this validation did not publish external PRs. c64cast validation covers Linux/Python 3.12 with the selected frozen dev+web profile, not the complete platform matrix, lint/type checks, or hardware acceptance. Existing upstream PR #387 was revalidated without creating a competing PR.

See the [roadmap](ROADMAP.md) for remaining product work.
