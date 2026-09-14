# Faster repair workflow

## Downloads

Source `git fetch`, GitHub API reads, issue scaffolding and evidence-artifact
downloads retry transient failures up to three attempts with short exponential
backoff and jitter. TLS timeouts, connection resets, HTTP 408 and selected
5xx responses are retryable. Rate limits, authentication/access failures, missing resources
and certificate validation errors stop immediately. Partial artifact downloads
are discarded before retry. Individual Git/artifact commands time out after
60 seconds; scaffold HTTP reads after 30 seconds.

GitHub writes are not blindly retried. Existing PR identity and branch checks
still govern publication recovery. Tests/builds and dependency installation do
not gain retries in this release.

## Language and protocol starters

```sh
bcl new https://github.com/owner/project/issues/123 --template cpp --protocol udp
bcl new https://github.com/owner/project/issues/124 --template python --protocol tcp
bcl new https://github.com/owner/project/issues/125 --template node
```

Each command creates a draft passport, a language-specific probe, an executable
JSON-reporting test driver, build recipe, owner/report placeholders and template
notes. C++ probes are compiled with the existing container compiler; Node and
Python probes use the pinned runtime. TCP and UDP starters use BCL's existing
loopback stands, pass their endpoint through `BCL_HOST`/`BCL_PORT`, capture
transcripts and clean up on failure.

The probes deliberately fail until an engineer implements real reproduction and
acceptance against the project. The default project recipes are `make`,
`npm run build`, and Python `compileall` (syntax checking only); adapt them to
the actual repository. Dependencies still need an audited recipe where required.
The PING/PONG protocol example is illustrative. These are transport starters,
not complete OSC, VISCA, SSC or device emulators.

## Board registration after publication

Successful `bcl publish` writes the PR URL and candidate identity into
`tracking/repairs.json` and regenerates only the managed section of `REPAIRS.md`.
It also saves these two files to the repository configured by `boardRepository`
in `bcl.config.json` using the operator's `gh` credentials. Set that field to
your own BCL repository when reusing the project. Existing manual board rows
are preserved. Registrations are keyed by PR URL and are idempotent.

Remote writes use the latest board revision. If another writer advances the
branch, registration reloads that revision and merges its one entry; it never
force-pushes. If board access fails after PR creation, the command returns the
existing PR URL with `boardPending`/`boardError`. Repeat publication to complete
registration without creating a duplicate PR. A dry run does not update the board.

## Read replies and CI

```sh
bcl sync
bcl metrics
bcl inbox
bcl inbox example-123
bcl ack example-123
```

The **Repair tracking** GitHub Actions workflow runs hourly at minute 23 UTC,
and can be started manually. It reads the registry's PRs, current-head checks
and statuses, source-issue comments, PR discussion, review comments and reviews.
GitHub may delay scheduled runs. The workflow saves the registry and managed
board section with a normal commit, without executing code from those projects.
An external push race causes a failed save rather than overwriting another
commit; the next run reads again. The initial registry includes the 12 distinct existing
manual-board repairs.

The first sync imports existing discussion as unread. Later syncs preserve read
flags, and edited replies become unread again. Comments by the source issue's
author are labelled `reporter`; this does not establish who operated equipment.
An API failure retains that repair's previous snapshot and marks it stale, while
other repairs can still update. Pagination covers up to 10,000 items per endpoint;
exceeding the cap fails that refresh rather than claiming a complete snapshot.

`inbox` displays stored events, not a live fetch. Update your local checkout to
see the scheduled workflow's latest snapshot, or run `sync` locally. `ack` marks
the events you actually have read locally and on the configured remote board;
concurrently arriving or edited events stay unread. Local `sync` writes files
only; the scheduled workflow is what commits recurring snapshots.

`metrics` reports repair velocity from the saved snapshot: median time from the
issue's creation to PR creation, from a case's recorded triage selection to PR creation, from PR creation to merge, and
from PR creation to the source reporter's first response. It displays these
beside merge rate, CI success and candidate-bound evidence coverage. Run `sync`
first when live timestamps matter. Missing timestamps remain `null`; GitHub
silence is not converted into a fast or successful outcome. The selection clock
uses the immutable `checkedAt` value in each case's `triage.json`, so the age of
an old issue is not charged to the repair itself.

The selection queue puts the reviewed `freshness` score before delivery
readiness and total score. A recent, still-active owner pain therefore wins a
tie against an equally repairable stale report; freshness never bypasses the
eligibility gates, evidence requirements, or minimum quality score.

No comments, emails or automated interpretations are sent to owners. Review the
inbox and answer deliberately. Hardware status is never inferred from prose.

## Record an explicit hardware result

```sh
bcl hardware-result example-123 --file owner-result.json
```

Use the result form from the existing hardware kit. Fill in `case`,
`candidateSha256`, `deviceModel`, `firmware`, `applicationVersion`, `steps`,
`observed`, and `result` (`PASS`, `FAIL`, or `INCONCLUSIVE`). Import validates the
candidate identity and records `REPORTED_PASS`, `REPORTED_FAIL`, or
`REPORTED_INCONCLUSIVE` locally and on the remote board. It does not change the
case passport's `hardwareVerified` flag or independently authenticate the author.

Historical registrations without a candidate hash cannot accept a hardware
result until linked to a specific published candidate. If a remote update fails,
the local record remains available; rerun the same explicit command after access
recovers. Commit/sync operations preserve the distinction between automated test
evidence, owner-reported results and engineering acceptance.
