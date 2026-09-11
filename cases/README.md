# BCL case passports — version 1

Each repair lives in `cases/<id>/` with one executable `case.json` passport.
Start from [the ATEN example](aten-2029/case.json). The common workflow discovers
passports automatically; adding a case does not require another workflow.

| Field | Meaning |
| --- | --- |
| schemaVersion, id, title | Format version, stable directory id, readable name |
| issue, problem, reproduce | Original report, practical problem, reproducible input |
| acceptance, repair | Observable success condition and proposed change |
| source | Repository, immutable 40-character commit, checkout directory, affected file |
| runtime.node | Exact Node version used for testing and packaging |
| packageVersion | Clearly marked candidate version |
| steps | Ordered prepare, test and build commands; each has cwd and argv |
| artifacts | Package pattern and machine-readable test report |
| verification | Hardware/UI status, limitations and owner-operated acceptance task |

Commands are reviewed repository code, executed as argument arrays without a
shell. Passports are not an input format for executing unreviewed external issue
text. Paths are relative to the BCL repository. The runner validates required
fields, source revision and runtime and stops immediately on a failed step.

Local workflow:

1. `node scripts/case.cjs list` discovers and validates all passports.
2. `node scripts/case.cjs validate aten-2029` checks one passport.
3. Check out its source repository at its pinned commit into source.directory.
4. With the declared Node runtime, `node scripts/case.cjs run aten-2029` prepares,
   tests and packages the same checkout. Start with a fresh checkout on each run.

The Actions run provides `<id>-test-build` and `<id>-report`; the latter includes
the exact passport. A successful run proves only the documented automated checks.
Keep hardware and UI verification false until evidence from those checks exists.
Owner feedback should include model, firmware, Companion version, the exact build,
expected/observed behavior and logs. Test packages in a separate setup first.

ATEN is the first migrated case. The Intelix/TCC2 regression suite remains in
`lab.cjs`; it is not yet represented as separate executable passports.

Every case run now writes `reports/<id>/evidence.json`, a passport snapshot and
`PR-REPORT.md`. These include stage results, upstream/BCL revisions, package
SHA-256 hashes and remaining owner checks. Actions publishes them with the report
and shows the Markdown in the run summary. A failed execution also writes failure
evidence. The Markdown is prepared for review; it is not automatically posted.
Case test reports must contain a nonempty `results` array with PASS statuses.
