# FPP PTP lock evidence

Candidate patch for a separate defect discovered while investigating
[FPP #2848](https://github.com/FalconChristmas/fpp/issues/2848).
**This does not resolve the reported software-PTP / 1970 system-date problem.**

## Confirmed defect and repair

`RefreshPtpCache()` defaults a missing or invalid `master_offset` to zero.
`WaitForPtpLock()` consequently treats a SLAVE port as settled without a valid
measurement. A failed time-status query similarly defaults `gmPresent` to false
and treats a LISTENING port as a confirmed standalone leader at the deadline.
Negating `INT64_MIN` to calculate the absolute offset also overflows.

The patch records validity separately from values, requires valid follower
evidence and an explicitly absent grandmaster for the standalone path, and
compares the signed offset against the existing strict +/-1 ms bounds.
MASTER and GRAND_MASTER behavior remains intact. It does not change ptp4l
configuration, time discipline, RTP pacing or the existing timeout policy
(FPP may still start with provisional anchors after timeout).

## Reproduce

```sh
bcl run fpp-2848-ptp-lock
```

The v2 runner checks out the exact upstream commit in `case.json`, applies
`repair.patch`, and runs the test inside its offline container. The test extracts
and compiles the actual upstream cache and wait methods, plus their cache
structure and constants, before and after the patch. Process checks, pmc replies
and logging are stubbed. The assertions execute C++ under UndefinedBehaviorSanitizer.

Twenty-five checks cover two baseline negative controls, missing/malformed
management data, a previous good cache followed by bad data, integer extremes,
tolerance boundaries and valid/transitional port states. A PASS means these
bounded checks passed. It is not a full FPP build or hardware/audio qualification.
No host clock is changed and no PTP daemon is started.

## Remaining work on the reported epoch problem

The pinned software-timestamp path starts ptp4l without `free_running` and
reads `CLOCK_REALTIME` as its media clock. Removing phc2sys alone therefore
does not isolate wall time from PTP. This is consistent with the maintainer's
hypothesis; the owner's no-PHC diagnostics remain outstanding.

Simply enabling linuxptp's `free_running` option prevents its system-clock
adjustment, but leaves FPP's existing media clock outside the grandmaster's
domain. That is not a complete repair. A replacement needs a virtual media
clock with measured offset/rate, sample freshness and grandmaster-change
handling, plus startup/watchdog integration. Realtime steps must not corrupt
the sample-to-monotonic mapping. See the official
[ptp4l configuration reference](https://www.linuxptp.org/documentation/ptp4l/).

Before declaring #2848 fixed, obtain the owner's NIC/PHC capabilities and paired
PTP/date diagnostics, then validate a separate clock implementation against
cold boot, a grandmaster with an arbitrary epoch, date corrections, clock drift,
lost sync and grandmaster replacement. Verify continuous audio and scheduling
on the owner's Pi and Dante equipment. This patch does not establish that a
numerically valid linuxptp measurement is fresh, either.
