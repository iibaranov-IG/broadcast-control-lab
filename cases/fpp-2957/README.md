# FPP #2957: USB DAC without S16 support

[FPP #2957](https://github.com/FalconChristmas/fpp/issues/2957) reports that FPP 10 generates an `S16LE` PipeWire adapter for an SMSL SU-1 that advertises only `S32_LE` PCM. PipeWire rejects the adapter and the owner has no audio until manually editing the generated configuration.

The case compiles the exact C++ selection function with a deterministic probe and covers the S32-only device, the earlier fixed-bit-clock regression, cost-free widening, and an unavailable probe. It also checks that the PHP control path mirrors the rule and that generation 8 refreshes existing configurations.

Hardware remains owner-verified: install [PR #2958](https://github.com/FalconChristmas/fpp/pull/2958), reboot, confirm `audio.format = "S32LE"`, and play audio through the SMSL SU-1.
