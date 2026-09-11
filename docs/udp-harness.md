# UDP test stand

`ScriptedUdpDevice` binds an ephemeral IPv4 port on loopback only. Connect a local
module under test to the returned host and port. `receive()` consumes exactly one
binary datagram and preserves the sender, including packets arriving before the
wait. `send(bytes, peer)` replies to that sender. `run(steps)` checks whole packets
in order; replies can be delayed, repeated, or omitted to model silence and retry.
An unexpected packet or receive timeout fails the scenario.

```js
const endpoint = await device.start()
// Configure the module under test with endpoint.host and endpoint.port.
await device.run([
  { expect: requestBytes, replies: [] },
  { expect: requestBytes, replies: [{ data: responseBytes, delayMs: 10 }] },
])
const evidence = device.report()
await device.stop()
```

Reports contain ordered directions, byte lengths, hexadecimal payloads and peers.
Use synthetic data: hex is an exact capture, not credential redaction. Reports
always identify simulated evidence and hardwareVerified=false. The CI artifact
includes `udp-harness.json`, a synthetic lost-reply/retry demonstration; it is not
an AutoPTZ or VISCA validation and does not claim vendor compatibility.

Run `node --test test/scripted-udp-device.test.mjs`. Existing `test:harness`
automatically includes this suite. A case test can import this helper and write
its report to the artifact path specified in its case passport.

Next protocol profiles need exact protocol/version references and real captured
or documented exchanges. UDP support alone does not implement Sony, Panasonic,
Vaddio, OSC, MIDI or Ember+. Owner reports should identify the case, build, device
model/firmware, expected versus observed behavior and remaining hardware checks.
