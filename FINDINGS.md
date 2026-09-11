# First diagnostic batch

These are reproducible software findings against the commits pinned in lab.cjs.
Neither is a hardware observation. Both acceptance conditions now pass at the
fixed revisions while the historical Intelix routing negative control remains.

## BCL-001 — Intelix login prompt buffering

Input: two ordinary incoming chunks, `User` followed by `name: `.
Expected: configured test username is sent without waiting for a newline.
Observed: no reply, because handleData only processes newline-terminated lines.
Impact: authentication can stall on a Telnet server that emits an unterminated
prompt. Actual DIGI-88FS prompt formatting still needs owner verification.

Fixed in `3834e91d22580ea0faa49057e9f38166cadc1e75`. The parser now reacts to
fragmented, unterminated login prompts and consumes the prompt from its buffer.

## BCL-002 — TCC2 protocol error reported as healthy

Input: an SSC error-only reply with code 400 (not understood).
Expected: an error-only response does not establish healthy device state.
Observed: handleMessage sets InstanceStatus.Ok despite receiving no valid device
state. This can conceal a rejected query.

Fixed in `375e281ae819a7819f53328c4cf9c3689a1ab3b2`. SSC error payloads are
reported as a connection failure and no longer fall through to healthy state.

No production network or customer device was accessed by this diagnostic batch.
Owner-operated hardware checks remain the next qualification step.
