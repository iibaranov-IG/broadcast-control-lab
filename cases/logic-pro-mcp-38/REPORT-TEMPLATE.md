# Reproduction

At bdc105e7, the documented volume, pan, and master-volume operations have no successful route. The focused contract exits with `MIXER_PARAMETER_CONTRACT_BROKEN`.

# Repair

Preserve `track`/`value` through dispatcher and channels. Resolve the real Master strip through Accessibility, falling back to Stereo Out only when no separate Master strip is exposed.

# Owner checks

With a disposable Logic Pro project and mixer visible, move a test track volume and pan, then master volume. Confirm only the intended controls move and report the Logic Pro version and observed strip labels.
