# AutoPTZ #155: UDP backend diagnostic

Source: https://github.com/AutoPTZ/autoptz/pull/156
Pinned revision: `39d8ebab461d86e8e06a683905829d21acec7adc`.

Run `python3 cases/autoptz-155/prepare.py`, then
`node cases/autoptz-155/test.mjs` (Python 3.12, Node 22).

This loads the unchanged PTZ backend and its two standard-library dependencies
in an isolated Python namespace. Socket calls are real; the camera is BCL's
loopback-only ScriptedUdpDevice. Full AutoPTZ package initialization, UI, tracking,
configuration persistence and physical cameras are outside this diagnostic.

Four checks cover raw stop datagrams, whole Sony-framed inquiry replies, short
replies and silence. Packets follow the pinned implementation and its existing
tests; this is not independent protocol certification. In particular, the check
does not establish correct framing for every camera model or every response type.

`reports/autoptz-155.json` contains results and the ordered hex packet transcript.
The dedicated diagnostic workflow preserves it on both success and failure.
This is a backend diagnostic, not an installable AutoPTZ build or a migrated
package-producing case passport.
