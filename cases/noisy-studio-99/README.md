# Noisy Studio #99

The packaged app inherited a browser-tab microphone choice from its older web
deployment and therefore requested Chromium microphone permission instead of
using the native device.

BCL applies the same backend and picker regressions to the pinned revision,
records their failure, applies the repair, and runs all Python and dashboard
tests. The repository owner retains the final packaged-app microphone check.
