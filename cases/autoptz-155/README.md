# AutoPTZ #155: UDP backend diagnostic

Source: https://github.com/AutoPTZ/autoptz/pull/156
Pinned revision: `39d8ebab461d86e8e06a683905829d21acec7adc`.

Run `bcl run autoptz-155` (Git, Node 22+ and Docker on the host).
The v2 runner fetches the pinned source and supplies Python 3.12 in its offline container.

This loads the unchanged PTZ backend and its two standard-library dependencies
in an isolated Python namespace. Socket calls are real; the camera is BCL's
loopback-only ScriptedUdpDevice. Full AutoPTZ package initialization, UI, tracking,
configuration persistence and physical cameras are outside this diagnostic.

Four checks cover raw stop datagrams, whole Sony-framed inquiry replies, short
replies and silence. Packets follow the pinned implementation and its existing
tests; this is not independent protocol certification. In particular, the check
does not establish correct framing for every camera model or every response type.

The common workflow publishes `autoptz-155-evidence` with results, durations,
the passport, Markdown summary and hashed packet transcripts. Locally it is in
`reports/autoptz-155/`. This is a diagnostic v2 passport with no package output.
