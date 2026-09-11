# First diagnostic batch

These findings were reproduced in diagnostic commit 0b375156ae5c84a6e703cfeac65668eb544eeee4.
Both are now fixed in the revisions pinned in lab.cjs. Neither is a hardware observation.
Intelix fix: 3834e91d22580ea0faa49057e9f38166cadc1e75.
TCC2 fix: 375e281ae819a7819f53328c4cf9c3689a1ab3b2.

## BCL-001 — Intelix login prompt buffering

Input: two ordinary incoming chunks, `User` followed by `name: `.
Expected: configured test username is sent without waiting for a newline.
Observed: no reply, because handleData only processes newline-terminated lines.
Impact: authentication can stall on a Telnet server that emits an unterminated
prompt. Actual DIGI-88FS prompt formatting still needs owner verification.

## BCL-002 — TCC2 protocol error reported as healthy

Input: an SSC error-only reply with code 400 (not understood).
Expected: an error-only response does not establish healthy device state.
Observed: handleMessage sets InstanceStatus.Ok despite receiving no valid device
state. This can conceal a rejected query.

The same acceptance conditions now test the fixed revisions, plus prompt
deduplication, fragmented password prompts, empty SSC replies and recovery after
a valid device reply. No production network or customer device was accessed.
