# OLA KiNET unreachable-device isolation

This case covers [OLA issue #1850](https://github.com/OpenLightingProject/ola/issues/1850).
An unreachable KiNET power supply can fill a blocking UDP socket while its
address is unresolved and stall the event loop that serves healthy universes.

The candidate makes the KiNET socket non-blocking before binding it. BCL runs a
kernel-level flag probe and verifies the production setup order plus the added
OLA regression test. The full upstream `KiNetTester` was also built and run in a
clean Debian environment; upstream CI remains the reproducible full-build gate.
