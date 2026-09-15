# Reproduction

Generate `lib/opus.c` with `WITH_TRANSCODING` and inspect the first two lookup tables.

# Repair

Use lookup slot 1 for application values while encoder option names remain in slot 0.

# Owner check

Run an Opus transcode with `packet_loss=10` and negotiated `useinbandfec=1`; confirm the warning is gone and FEC is emitted.
