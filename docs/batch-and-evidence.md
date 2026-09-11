# Batch repairs and upstream evidence

## Long triage campaigns

For a persistent queue of up to one hundred distinct public GitHub issues, put
one canonical issue URL per line and run:

```sh
npm run bcl -- campaign repair-100 --file campaigns/repair-100.txt --concurrency 4
```

The campaign performs metadata triage only. It checkpoints after every issue in
`reports/campaigns/<name>/state.json`, so repeating the command resumes pending
work without rereading completed issues. Use `--retry-failed` to retry failed
reads. The concurrency range is 1..8. Campaign results do not claim reproduction,
repair or permission to publish; selected issues still require a real red/green
case and independent publication evidence.

```sh
npm run bcl -- batch case-one case-two case-three
```

Batch execution requires every selected passport to have an `upstream` contract.
It downloads each repository/commit once and builds each Dockerfile/runtime image
once per batch. Every case receives a separate filesystem copy, including its Git
objects. The shared source cache is never mounted into executing containers.
Patches, logs, candidate archives and eventual PRs remain independent. A failed
case does not stop later cases; the batch as a whole returns failure.

The cache lasts for that batch only. Dependency installation is still controlled
by the existing audited recipes and is not yet shared across cases. This first
version runs cases sequentially. It does not test combinations of patches.

The `BCL batch` manual Actions workflow accepts space-separated ids and uploads
`batch-evidence` with separate case directories. Publish each case independently:

```sh
npm run bcl -- publish case-one --batch --fork owner/project --run https://github.com/owner/bcl/actions/runs/123
```

A completed batch may contain failed peers. Publication requires its completed
batch manifest to identify the selected case as PASS, plus all ordinary per-case
selection, tree, red/green and hash checks. Cancelled or incomplete batches cannot
qualify publication.

## Red → green contract

`ready` means a passport is configured; it is not proof of a repair. The 22
unmigrated cases are explicitly `diagnostic`; c64cast-368 now exercises the actual
upstream red/green path. Normal
`bcl test` and `bcl batch` require upstream evidence. Existing diagnostic cases can
run with `bcl test <id> --legacy-contracts`; their `CONTRACT_ONLY` result cannot
qualify for publication. CI uses compatibility mode only for passports explicitly marked `diagnostic`. A configured upstream case still runs all
red/green checks when this flag is present.

Add an `upstream` object to a passport (paths are relative to the selected source):

```json
{
  "kind": "python",
  "source": "upstream",
  "timeoutMs": 300000,
  "setup": [{"cwd": ".", "argv": ["git", "apply", "../../cases/example/tests-only.patch"]}],
  "build": [],
  "testFiles": ["tests/test_repair.py"],
  "regression": {"cwd": ".", "argv": ["python3", "-m", "unittest", "tests.test_repair"]},
  "negative": {"exitCode": 1, "outputIncludes": "AssertionError: expected completion callback"},
  "suite": {"cwd": ".", "argv": ["python3", "-m", "unittest", "discover", "-s", "tests"]},
  "suiteOutputIncludes": "Ran "
}
```

This is a shape example, not an executable repair. Install only the regression
tests in `setup`; keep production changes in `steps.prepare`. The test-only patch
must not include the repair. Review that separation when accepting a passport.
If an existing repair patch includes tests, split it before migration.

Execution order:

1. Verify pinned source/runtime; install the unchanged regression test; build baseline.
2. Run the regression and require its exact nonzero exit code plus a specific defect diagnostic.
3. Apply `steps.prepare`, then capture the publication candidate.
4. Rebuild with the same commands, run the same regression successfully, then the configured upstream suite.
5. Run existing case acceptance/build steps and verify the publication source did not change.

The declared regression files are hashed before and after both runs. Missing
executables, timeouts, signals, an already-green baseline, wrong failure text,
changed tests, failing suites and missing suite completion markers fail the case.
Commands, exit codes, signals, duration and output hashes are recorded, including
failed executions. A failed invocation has a heuristic failure category; it is not
automatically diagnosed as a product defect or a flaky test.

The suite must also emit a recognized nonempty summary: unittest `Ran N tests`,
Node TAP/spec `tests N`, CTest `tests failed out of N`, or Automake `# TOTAL: N`.
An empty or entirely skipped recognized suite cannot qualify.

Choose an upstream command that actually runs the intended suite and a completion
marker that rules out empty execution. BCL records what ran; it cannot infer that
a hand-written wrapper covers every test. `candidate-suite` does not imply all
platforms, optional features, lint/type checks or hardware checks passed. Respect
the project's contribution gate when choosing commands.

| Kind | Typical build | Typical suite command |
| --- | --- | --- |
| `cpp-cmake` | `cmake -S . -B build`, `cmake --build build` | `ctest --test-dir build --output-on-failure --no-tests=error` |
| `cpp-autotools` | `autoreconf -fi`, `./configure`, `make` | `make check` |
| `python` | project-specific, often none | `python3 -m unittest discover -s tests` |
| `node` | project's build script | `npm test` or the project's complete test command |

These are command patterns, not resolved dependency profiles. The image provides
CMake, Autotools, pkg-config, the compiler, Node and Python. Projects needing Qt,
Python wheels or native libraries still need an audited dependency profile.

## Performance

`reports/batches/<timestamp>.json` and `.md` record total wall time, unique downloads,
source/image reuse, download/build/copy time and each case's duration. Per-case
evidence contains baseline, patch preparation, test and build durations, with
individual upstream command timings. Triage records its own duration. Engineering
repair time and publication time are marked unmeasured, not zero. Patch application
is not counted as time spent developing the repair.

## External upstream runs

```sh
npm run bcl -- upstream-import example --file /path/to/manifest.json
```

The manifest must have `schemaVersion: 1`, `case`, `candidateSha256`, the exact
passport `sources` array, `environment`, `runUrl` and a nonempty `commands` array.
Each command records `argv`, `cwd`, `exitCode`, `durationMs`, `log` (relative to the
manifest) and the log's `sha256`. BCL validates all bytes before importing them.

Imported logs are labeled `EXTERNAL_REPORTED` and bound to the captured candidate.
They supplement the bundle without upgrading contract-only evidence to red/green
or proving that an external machine ran the claimed source. Re-running the case
replaces its bundle; import external results after the final run.

## Publication and tracking

Publication requires the exact configured baseline-red, candidate-green and
candidate-suite command records plus their hash-checked logs. Generated PR test
claims list those actual commands. General test-pass statements in passport prose
are rejected; put claims in the generated evidence section. This is a structural
claim check, not a universal natural-language truth detector.

```sh
npm run bcl -- track example https://github.com/owner/project/pull/123
```

The PR must target the passport's publication repository and explicitly reference
its issue. The command registers it on the configured board and reads CI, reviews,
comments, mergeability and closure. Existing tracking automation continues updates.
Attachment does not establish that the PR's bytes passed BCL; unbound external PRs
remain `NOT_BOUND`. No comment is posted and the PR is not modified.

## Audit hardening

Every upstream run requires a hash-bound `selection.report` matching the exact
issue, repository and commit. New passports copy their approved triage report;
publish requires a report no older than seven days. `SKIP` and `RESERVE` do not
enter the automatic queue. Existing-PR revalidation can record
`selection.purpose: EXISTING_PR_VALIDATION`, an explicitly linked `existingPR` and
a review reason. It still requires bound readable source metadata and respects
the denylist; it can never authorize a new publication. c64cast-368 uses this mode
for our existing PR #387, with the actual read-only triage report preserved.

Upstream and publication sources must match. Every tracked/nonignored changed
source or test file must appear in `publish.paths`. BCL constructs an independent
Git index and records the candidate tree; tests cannot change that tree, and GitHub
must construct exactly the same tree before a PR is created. Ignored build outputs
and acquired dependencies are outside that source-tree identity and remain subject
to their dependency/runtime profiles.

Shared downloads are promoted atomically after successful preparation. A failed
attempt is cleaned before the next case retries. When tracking observes a changed
PR head, evidence and previous hardware results become STALE; old hardware reports
cannot be imported as fresh proof until the candidate is rebound.
