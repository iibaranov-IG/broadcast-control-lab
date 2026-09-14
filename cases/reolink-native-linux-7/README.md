# Reolink standalone camera sidebar classification

The reporter's RLC-510A is shown as a one-camera NVR tree: a redundant host header sits above the same camera row. The persisted host kind is only ever promoted to `nvr`; a later successful one-channel probe never restores `camera`, so a stale classification survives indefinitely.

The candidate assigns both sides of the classification on every successful probe. Multi-channel devices remain NVRs, while one-channel devices self-heal to standalone cameras and render as a single sidebar row.
