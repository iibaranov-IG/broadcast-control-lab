# Reproduction

HX Effects firmware 3.80: index 104 is `27A`; baseline TonePush maps it as `35C`.

# Repair

Device profiles own preset-bank geometry and all user-facing label paths use the active profile.

# Owner checks

Confirm `01D` and `27A` select the matching front-panel presets in the CLI and GUI, and that extracted backup filenames use the same labels.
