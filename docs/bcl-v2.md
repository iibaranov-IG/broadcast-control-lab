# BCL v2 execution boundary

One workflow replaces the previous ATEN/Zynthian matrix, standalone AutoPTZ and
legacy Intelix/TCC2 workflow. Five passports use the same runner and evidence format.

## Acquisition and execution

The host reads passports, fetches public source commits with Git, and builds the
runtime image. Checkout credentials are not persisted. No upstream application
code executes on the host. Only an audited package installer receives network
access; it uses a sanitized manifest and ignores package lifecycle scripts.

Actual case preparation, testing and packaging execute in a separate Docker run:

- network none, including no access to production devices;
- only an ephemeral staging directory mounted;
- no GitHub token, SSH directory or Docker socket passed through;
- host uid/gid, read-only image filesystem, temporary writable /tmp;
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

Existing transport helpers remain reusable. The named OSC/VISCA/SSC examples do
not constitute complete protocol profiles. Full protocol libraries, generalized
loss/duplication/reordering/corruption controls, owner-result import, automatic
repair-board updates and autonomous issue-to-PR repair are follow-up work.
