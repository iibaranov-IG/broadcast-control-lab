# Reproduction

At `b51ae6b`, `shortcuts.xml` maps the four seek action codes, but
`PlaybackUiActions` and `PlaybackController` do not register them. The BCL
negative control exits with `BUG_SEEK_ACTIONS_UNREGISTERED`.

# Repair

Register short and long seek actions for both directions. During active playback
they move the audio stream by the configured period and clamp to the project
bounds; while stopped they remain disabled so the normal cursor commands keep
the arrow keys.

# Owner checks

On the Windows development build, start playback and press Left, Right,
Shift+Left and Shift+Right. Confirm the playhead and audible stream move by the
configured short and long periods, and confirm all four commands appear and can
be remapped in Preferences > Shortcuts.
