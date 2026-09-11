# Broadcast Control Lab

First milestone: reproducible software contract checks against exact module commits.
This is not yet a hardware qualification service or a complete device simulator.

Run `npm test` with Node 22+. Set LAB_SOURCES to a directory containing the
Intelix repository as `intelix` and the TCC2 repository as `tcc2`.
Required commits are pinned in lab.cjs and the Actions workflow.

The Intelix negative control checks the real historical routing implementation.
The fixed action is exercised through a Companion API test double, including
fragmented input and absence of fabricated route confirmation.
TCC2 checks cover JSON parsing and camera-sector boundaries.

Every report contains exact revisions, individual results, limitations and
hardwareVerified=false. Reports must not be advertised as hardware certification.

Next milestones: independent TCP/UDP device simulators, authentication and
reconnect scenarios, full Companion runtime smoke test, owner-operated hardware
test package, redacted report export. No access to production devices is required
for this milestone. No client installer or autonomous repair workflow is included.

Protocol references:
- https://www.cs1.net/pic/intelix/DIGI-88FS_manual.pdf
- https://github.com/bitfocus/companion-module-requests/issues/2061

Commercial pilot: define one supported hardware/firmware combination and one
workflow, agree acceptance tests with its owner, then deliver and support it.

## External repair board

[REPAIRS.md](REPAIRS.md) tracks focused fixes submitted to the original
projects. Each entry links the reported problem, the public pull request, the
checks already completed, and any remaining hardware validation.

Equipment owners can also open a structured repair request in this repository.
Include the exact model and version, reproduction steps, evidence, and whether
you can test a proposed fix on the affected hardware.
