# Zynthian issue 1530

Run `bcl run zynthian-1530`. The common v2 workflow publishes
`zynthian-1530-evidence`, including the source-patch archive and hashed UDP logs.

This case targets the Oram branch used by the original report. It applies the
candidate patch to the exact upstream revision in `case.json`, builds the real
native mixer OSC sender with a JACK test stub, and connects it to two independent
BCL UDP endpoints on the same loopback address.

The test proves that a fader update reaches both source ports and that removing
one host-port endpoint does not remove the other. The report is software-only;
the owner-operated test in the passport remains required for hardware evidence.

The Vangelis development branch removed native mixer OSC feedback in August 2026
and is outside this case. Its remaining Python registration calls require a
separate migration decision from the Zynthian maintainers.
