# Executable case passports — v2

All cases use `cases/<id>/case.json`, validated by `scripts/case.cjs`.
Start with ATEN for a Node package, AutoPTZ for a Python diagnostic, Zynthian for
a native build, or Intelix for multiple source revisions. Run `bcl validate <id>`.

| Field | Meaning |
| --- | --- |
| schemaVersion | Must be 2 |
| id, status, title | Stable directory id; draft or ready; readable name |
| issue, problem, reproduce | Source discussion, practical problem, failing input |
| acceptance, repair | Observable success condition and change |
| sources[] | Unique id, repository, immutable commit, distinct sources/ directory |
| runtime | Exact Node and optional Python versions |
| watch[] | Additional file paths or directory prefixes affecting this case |
| steps | dependencies, prepare, test, build arrays of cwd/argv commands; only test must be nonempty |
| artifacts.report | JSON with nonempty results[]; each result has name, status and measured durationMs |
| artifacts.package, packageVersion | Optional package glob and candidate version; omitted for diagnostics |
| verification | hardwareVerified, applicationVerified, limitations, ownerCheck |

`bcl new <public-github-issue-url>` creates a draft and a failing placeholder.
It pins the issue repository, which may need replacing with the actual code
repository. Review and implement the case before setting status to ready.

`bcl run <id>` stages a fresh workspace, checks out each source, prepares the
runtime image, acquires approved dependencies, and executes prepare/test/build
offline. Preparation patches run inside the same offline container as the tests.
Passports are reviewed executable repository content, not untrusted issue text.

Dependency commands in a passport describe acquisition intent; arbitrary commands
are not executed with network access. The separate audited installer currently
supports only the pinned ATEN registry dependency set with package scripts disabled.
Cases with no dependencies use an empty dependencies array.

One `<id>-evidence` artifact includes the passport, execution JSON, Markdown report,
raw test JSON, hashed transcript files and optional package. No package is invented
for a diagnostic. The runner fails on an unsuccessful/missing test report and does
not reuse stale test output or packages. Runtime/image versions and durations are
recorded. Hardware and full-application verification remain independent.

PR selection matches case directories and watch prefixes. Shared infrastructure
changes rerun the full matrix; main/manual/nightly runs always select all cases.
Unknown or malformed passports fail selection instead of silently disappearing.
