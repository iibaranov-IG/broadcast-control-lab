# Thingino firmware #1636

Thingino's 2026-09-10 image introduced fMP4 browser preview. After a preview
client disconnected, prudynt left the video pipeline active and retained frame
buffers until low-memory cameras killed the process or rebooted.

The streamer repair is already present and physically measured in immutable
prudynt-t commit `354b1b4bde4aa67860021531b85549d88ee1717c`.
This case verifies that the firmware package advances to that exact commit and
that the source still contains all four parts of the cleanup.

BCL does not build or flash a camera image. The upstream commit records stable
heap use across ten sessions and 50 minutes on an affected device; a firmware
image test by one of the three issue reporters remains the final application
check.
