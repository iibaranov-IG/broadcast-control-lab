# node-av #349 — MJPEG USB-camera mode identity

The Linux enumerator treated every V4L2 FourCC as a raw pixel format. MJPG is a compressed codec, so it fell through to `AV_PIX_FMT_NONE` and callers could not identify the camera's common high-resolution modes.

The candidate adds `codecId` to device modes, reports MJPG/JPEG as `AV_CODEC_ID_MJPEG`, keeps raw formats paired with `AV_CODEC_ID_RAWVIDEO`, and carries the value through both native calls and the TypeScript API. The owner still needs to repeat enumeration on the reported `/dev/video20` camera.
