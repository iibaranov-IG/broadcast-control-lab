# Review an issue before building

`bcl triage` reads GitHub metadata before you spend time cloning and preparing a
build. It saves a decision with source links and the exact source commit inspected.
It does not execute upstream code or publish anything.

```sh
npm run bcl -- triage https://github.com/owner/project/issues/123
```

When issues and source live in different repositories, specify the source and,
optionally, a branch, tag or commit:

```sh
npm run bcl -- triage https://github.com/owner/tracker/issues/123 --source owner/project --ref main
```

Declare a known prerequisite explicitly; repeat `--dependency` for multiple items:

```sh
npm run bcl -- triage https://github.com/owner/project/issues/123 --dependency https://github.com/owner/library/pull/45
```

An optional `GH_TOKEN` or `GITHUB_TOKEN` raises GitHub's API allowance. Only read
requests are made. Transient failures use the shared bounded retry helper.

## Decisions

| Decision | Meaning |
| --- | --- |
| `READY_TO_INVESTIGATE` | No metadata blocker found within the reported coverage; engineering review can begin. |
| `NEEDS_INFO` | Review related work, source location, dependency hints or incomplete reads before scheduling a build. |
| `DEFER` | The issue is closed, the source repository is inactive, or an explicitly declared prerequisite remains unresolved. |
| `REJECT` | A selection exclusion applies, including a denied project, active related PR or established missing license. |

The current selection policy rejects a candidate with an active explicitly related
PR. Establish that work is unclaimed before selecting a new repair.
Closed dependency issues and merged dependency PRs satisfy this metadata check;
they do not prove the required change exists in the revision you intend to build.

## Checks and evidence

- Issue status and presence of a description.
- Source repository status, pinned commit, recognized source files and build manifests.
- Explicit PR references in the issue timeline, description and open PR descriptions.
- Root Node/Python manifests for Git, local and workspace dependency hints; submodules are flagged separately.
- Status of up to ten explicitly declared dependency issues or PRs.

Reports are saved to `reports/triage/<owner>/<repo>/<issue>/TRIAGE.md` and
`triage.json`. The JSON includes findings, links, read errors, coverage limits,
source revision and next actions. Re-running replaces that issue's local report.
All decisions are successful command results; automation should inspect the JSON
`decision` field. Invalid arguments fail the command.

## Limits

This is metadata triage, not reproduction or repair verification. Source and build
detection are heuristics. Unsupported languages, tracker-only repositories and
unreadable files need review; they are not classified as closed source.
Only explicit PR references are matched, so unrelated wording can hide relevant work.
Timeline and open-PR searches stop at 500 entries each; at most 20 linked PRs are
inspected. Truncated trees and failed reads are reported instead of giving an all-clear.

Dependency checks do not install packages or resolve transitive dependencies,
native libraries, runtime compatibility or equipment availability. Contribution
policies and reproduction instructions still need human review. Once selected,
prepare a case and use `bcl test` to collect actual repair evidence.
