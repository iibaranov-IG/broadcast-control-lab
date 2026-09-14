# PsychoPy microphone lifecycle in repeated online routines

Issue: https://github.com/psychopy/psychopy/issues/7777

The probe executes the pinned production methods which generate the PsychoJS frame code. The
unmodified release branch marks the microphone `FINISHED` before calling `pause()`. PsychoJS ignores
that call because `pause()` only operates while the recorder is `STARTED`. The repair defers the
status transition until the active recorder has been paused.

BCL verifies the exact generated statement order. The reporter's Pavlovia experiment remains the
browser and real microphone confirmation.
