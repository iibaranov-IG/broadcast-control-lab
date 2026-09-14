# Firefox: USB screensharing requires camera/microphone permission

Firefox can hide the reMarkable USB interface from ICE discovery until the site
has media permission. The candidate explains that browser behavior and offers a
Firefox-only action that requests permission, releases all acquired tracks, and
restarts discovery.

The same source-contract test fails on the pinned baseline and passes on the
candidate. BCL then runs the helper unit tests and complete production UI build.
Selecting the actual USB candidate remains a Firefox/reMarkable owner check.
