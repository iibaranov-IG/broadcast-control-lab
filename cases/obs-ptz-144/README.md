# OBS PTZ DataVideo VISCA/TCP framing

This case covers [obs-ptz issue #144](https://github.com/glikely/obs-ptz/issues/144).
It compiles the production framing helper, checks the exact packet documented by
the existing DataVideo integration, and exercises fragmented and coalesced TCP
replies. Contract checks confirm that ordinary VISCA/TCP remains the default and
that DataVideo is exposed as a separate camera choice.

The automated result proves the stream framing and application wiring. A camera
owner must still confirm movement, stop commands, presets and reconnect behavior
on a physical DataVideo PTC-series camera.
