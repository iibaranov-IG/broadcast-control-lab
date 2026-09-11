# BCL delivery roadmap

## Implemented foundation

- Authenticated scaffold reads with bounded rate-limit waiting and resumption.
- Batch source/image reuse with independent working copies and per-case evidence.
- Explicit upstream red/green contract, hashed command logs and publication gate.
- Candidate-bound external log import, labeled as externally reported.
- Existing-PR attachment with CI/review/conflict-state tracking.
- Rule-file inventory and bounded reading; evidence-backed selection scoring and denylist.
- Batch preparation timings and per-command timings; unknown durations remain unknown.

## Next acceptance gates

| Work | Done when |
| --- | --- |
| Migrate the nine c64cast cases | Tests-only setup is separated from each repair; the actual baseline assertion fails, candidate passes, and the configured upstream gate runs inside BCL. Current contract checks are not this evidence. |
| Reproducible dependency profiles | Python, Node, CMake, Autotools and Qt dependencies use reviewed pinned manifests/hashes; shared caches survive independent case execution without cross-contamination. |
| Real batch benchmark | The nine same-revision c64cast cases use one download and one image preparation; actual timings and all individual results are retained. The harness reuse test is not this benchmark. |
| Candidate refresh | A fresh immutable upstream revision is selected; patch conflicts produce a report; successful replay regenerates all evidence and never force-updates the old PR automatically. |
| Cross-repair conflict check | Candidate combinations are applied in disposable worktrees against a named upstream revision, with text conflicts distinguished from behavioral incompatibilities. |
| Contribution compliance | Scoped rules are reviewed and recorded as actionable commit/test/comment requirements before publishing. Reading and keyword hints alone do not constitute compliance. |
| Repository memory | Source-qualified records capture accepted formats, refusal reasons, response times and CI reliability, with expiry and uncertainty. |
| Owner kit | Three case-specific actions, a downloadable candidate and parsed results bind to exact candidate bytes; unsupported logs remain unclassified. |
| Outcome metrics | Merged, owner-confirmed, hardware-reported, released and recurrence observation are separate fields with source links and observation windows. Silence is not proof of no recurrence. |
| Delivery calibration | Enough observed outcomes exist to estimate delivery probability with uncertainty; readiness scores remain explicitly uncalibrated until then. |
| Full lifecycle timing | Triage, acquisition, reproduction, human repair, tests and publication are correlated by run/candidate identity without treating missing measurements as zero. |

Choose new repairs through triage, exclusions and delivery-first ranking. PR count
is an activity metric, not the success criterion. Do not publish to Bitfocus or any
configured denied project, compete with occupied issues, or pursue excluded work.
