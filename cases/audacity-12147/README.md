# Audacity 4 playback seek shortcuts

Issue: https://github.com/audacity/audacity/issues/12147

Audacity's default shortcut file still assigns Left, Right, Shift+Left and
Shift+Right to four playback-seek action codes, but Audacity 4 does not expose
or dispatch those actions. The shortcut resolver therefore falls back to the
ordinary playhead actions, whose seek does not move an already running stream.

The candidate restores the four named actions, uses the configured short and
long periods, moves the active stream, clamps at zero and project end, and
leaves stopped cursor movement available. The negative control checks the
pinned source before the actions exist; candidate checks cover registration,
preference wiring, boundaries, active-state gating and focused controller tests.

The complete Qt application is not built inside BCL. Upstream CI and the
reporter's Windows check remain required before calling the application fixed.
