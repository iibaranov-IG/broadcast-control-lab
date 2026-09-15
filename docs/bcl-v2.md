# BCL v2 execution boundary

One workflow replaces the previous ATEN/Zynthian matrix, standalone AutoPTZ and
legacy Intelix/TCC2 workflow. All 23 passports use the same runner and evidence
format; 22 remain explicit diagnostics, while c64cast-368 uses upstream red/green.

## Acquisition and execution

The host reads passports, fetches public source commits with Git, and builds the
runtime image. Checkout credentials are not persisted. No upstream application
code executes on the host. Only an audited package installer receives network
access; reviewed recipes validate manifests and prohibit project lifecycle/build
hooks during acquisition. The c64cast recipe validates the pinned lockfile and
pyproject hashes, installs frozen dependency wheels, and acquires setuptools
83.0.0 as its build backend. Editable project installation runs later via offline
`uv sync --frozen --no-build-isolation`; its output is retained as a setup log.

Actual case preparation, testing and packaging execute in a separate Docker run:

- network none, including no access to production devices;
- only an ephemeral staging directory mounted;
- no GitHub token, SSH directory or Docker socket passed through;
- host uid/gid, read-only image filesystem, temporary writable /tmp;
- isolated `HOME=/work/.home`, separate from temporary roots and source checkouts;
- all capabilities dropped, no-new-privileges, memory/CPU/process limits.

The stage contains BCL scripts and public source checkouts. BCL's own .git,
preexisting sources, reports, caches and node_modules are excluded. Source .git
metadata is retained for baseline comparisons, with credential-free public URLs.
Output bundles are copied out and staging is deleted. Network isolation means
live owner-operated hardware checks must be a separate future execution mode.

This is container isolation, not a claim that arbitrary hostile code is harmless.
Passports, commands and dependency recipes require review. Runtime image tags and
registry availability can change; actual image IDs are recorded. Pinning image
digests and expanding dependency lock auditing are follow-up reproducibility work.
CI cancellation or runner termination can prevent final evidence export.

## Scope of this release

Implemented: v2 passports, multiple source checkouts, Node/Python runtimes, optional
packages, common CI, changed-case selection, cancellation, nightly full matrix,
draft generator, generic application verification, durations and hashed packet logs.
Pull requests and ordinary pushes compare against their event baseline, so a case-only
commit runs that case alone. Shared runner, workflow, package or test changes still run
the full matrix; scheduled and manually dispatched workflows remain full sweeps.

Existing transport helpers remain reusable. The named OSC/VISCA/SSC examples do
not constitute complete protocol profiles. Full protocol libraries, generalized
loss/duplication/reordering/corruption controls and autonomous issue-to-PR repair
are follow-up work. Owner-result import and repair-board updates now exist; see
[automation](automation.md) and the [current roadmap](ROADMAP.md) for their limits.
