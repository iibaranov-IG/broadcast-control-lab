# Publish a tested repair

The publication flow reuses the v2 runner and evidence. Tests and project builds
still run offline, without GitHub credentials. Publishing reads a completed
artifact and uses the operator's authenticated GitHub CLI (`gh auth login`).
It does not execute the downloaded project or rerun its build with credentials.

```sh
bcl test fpp-2848-ptp-lock
bcl hardware-kit fpp-2848-ptp-lock
bcl publish fpp-2848-ptp-lock --fork YOUR_ACCOUNT/fpp --dry-run

# After the case has passed the BCL Actions workflow:
bcl publish fpp-2848-ptp-lock --fork YOUR_ACCOUNT/fpp \
  --run https://github.com/iibaranov-IG/broadcast-control-lab/actions/runs/RUN_ID
```

Replace YOUR_ACCOUNT and RUN_ID. The fork must already exist in the target's
fork network and be writable with your `gh` credentials. You may also name the
target repository itself when you have write access. No additional token is
passed to the test container. GitHub access errors stop publication and are
reported; the command does not switch accounts or work around denied access.

## Configure once per repair

Add `publish` to the case passport before testing:

```json
{
  "publish": {
    "source": "upstream",
    "target": "FalconChristmas/fpp",
    "base": "master",
    "paths": [
      "src/mediaoutput/AES67Manager.cpp",
      "src/mediaoutput/AES67Manager.h"
    ]
  }
}
```

`source` identifies an existing entry in `sources`. `paths` lists individual
source files to publish, including new or deleted files. Choose the complete
repair, including required tests and configuration. Paths are explicit so build
products, dependencies and temporary test support do not accidentally enter a PR.
The initial implementation supports up to 100 files / 5 MiB and one source
repository per PR. Multi-repository cases keep their existing test support but
need separate publication configurations for separate upstream PRs.

After `prepare`, the runner captures these files as `candidate.json`, preserving
binary bytes, executable modes and deletions. It checks that these files have
not changed during test/build and records the candidate's SHA-256 in evidence.
Old artifacts without this snapshot must be regenerated. Source edits belong
in `prepare`, before the checks. This does not add new protocol acceptance tests.

## What publish does

1. Downloads `<case-id>-evidence` from the specified successful Actions run.
2. Checks the passport, result, report hashes, candidate hash and BCL revision.
3. Writes a reviewable `PUBLISH-PR.md` and `publish-plan.json` locally.
4. Checks repository access, fork relationship and baseline ancestry.
5. Creates a candidate branch from the exact tested baseline and a **draft PR**.
6. Saves the PR URL in `publication.json`.

The PR includes the problem, repair, reproduction, acceptance, check results,
run/artifact link, baseline, candidate hash, owner instructions and limitations.
It links the issue without an automatic closing directive. Publication does not
merge, mark ready, comment separately on an issue or notify an owner by email.

`--dry-run` prepares local files without remote writes. With `--run` it downloads
the real artifact; without it, it previews the local bundle. Actual publication
requires a successful Actions run. The local passport must match its snapshot,
so use the BCL checkout that produced that evidence.

Branch names include the case and candidate hash. Repeating publication returns
the existing PR, including a closed or merged PR, instead of reopening it.
An interrupted attempt can resume after branch creation. A conflicting branch
is never force-updated. A different candidate produces a different branch/PR.
The target branch may advance since testing; the PR states the original tested
baseline. Testing the merged result remains the upstream CI's responsibility.

## Owner kit

Every new case run includes `HARDWARE-CHECK.md` and `owner-result.json` in its
evidence artifact. `bcl hardware-kit <id>` can regenerate instructions from a
local result without repeating the test. A filled owner result is preserved.

The kit contains the case's actual owner procedure, expected result, known
limits, candidate identity and a result form initially marked `NOT_RUN`. It is
a manual check kit, not an automatic installer or a hardware qualification claim.
It is useful even for diagnostic cases that do not support publication.

## Scope of this release

The FPP PTP-lock case is configured for publication as a worked example. Other
cases continue to run normally; add their publication paths before generating
fresh publishable evidence. The FPP patch is a lock-validation repair, **not**
a fix for the reported 1970-date problem.

C++, Python and Node projects can use the same publication mechanism: it copies
tested files without knowing their language. Language and TCP/UDP starters,
automatic board registration, reply tracking and hardware-result import are
described in the [automation guide](automation.md). Hardware installation remains
case-specific.

Implementation uses the official [GitHub Git database API](https://docs.github.com/en/rest/git/trees)
through [`gh api`](https://cli.github.com/manual/gh_api). Local regression tests
exercise Git snapshots and a simulated GitHub API, including partial failure,
repeat publication, invalid evidence and branch conflicts. They do not establish
that any particular account has permission to create an upstream PR.
