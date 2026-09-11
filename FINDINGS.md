# First diagnostic batch

These are reproducible software findings against the commits pinned in lab.cjs.
Neither is a hardware observation. The diagnostic run intentionally fails while
the module under test violates the stated acceptance condition.

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

Next: fix the module behavior, add fixed commit identities alongside the failing
baseline, and rerun the exact acceptance conditions. No production network or
customer device was accessed by this diagnostic batch.
