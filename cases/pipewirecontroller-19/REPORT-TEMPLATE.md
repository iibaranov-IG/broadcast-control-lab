# Reproduction

The pinned Devices page has no timer or state reconciliation path, so external volume and mute changes remain stale until navigation or manual refresh.

# Repair

Poll while visible, update unchanged rows in place, protect recent local edits, and rebuild if PipeWire recreates a node with another id.

# Owner checks

Use Bluetooth headset buttons and GNOME controls while Route → Devices stays visible. Confirm volume and mute follow within three seconds, local drags do not jump backward, and reconnecting the endpoint preserves correct control targeting.
