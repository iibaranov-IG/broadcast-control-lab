# BCL external case 001: ATEN variable crosspoints

Source request: https://github.com/bitfocus/companion-module-requests/issues/2029

This is a feature request, not a hardware failure. The maintainer comment notes
that future Companion versions may offer this automatically; this case only
establishes behavior of the pinned module action implementation.

case.json is the executable case passport and identifies the upstream commit. upstream.mjs is an unchanged copy
of its actions.js (extension changed for isolated import). Original MIT license
is included. candidate.mjs changes only the crosspoint action: variable-enabled
text fields, asynchronous interpolation and integer/range validation. Saved
numeric options and profile recall retain their behavior.

Run: `node cases/aten-2029/test.mjs` with Node 22 or newer.
Generate an applicable patch: `git diff --no-index -- cases/aten-2029/upstream.mjs cases/aten-2029/candidate.mjs`
The workflow also packages the pinned upstream module with this candidate as
version `2.0.3-bcl.1`. Run `bcl run aten-2029`, or download `aten-2029-evidence` from the successful
GitHub Actions run and extract the module package for a local Companion test.
This is a BCL test build, not an official Bitfocus release.

The test double supplies variable expansion and captures sendCmd. It does not
run the Companion UI, Telnet transport or a physical matrix. The unchanged
command syntax is taken from upstream; no new hardware protocol is claimed.
Negative-control PASS means the old limitation was observed, not that upstream
supports the requested feature. Candidate PASS means the action contract passed.

No upstream issue was closed and no message or PR was sent. Hardware and actual
Companion UI verification remain pending.
