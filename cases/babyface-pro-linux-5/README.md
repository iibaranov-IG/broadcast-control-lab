# Babyface Pro Linux #5: runtime restart loses audio

[Issue #5](https://github.com/ismail-bahloul/babyface-pro-linux/issues/5) reports that changing the PipeWire/Bitwig buffer stops audio in both directions until the proprietary-mode driver is reloaded.

The case preserves the ALSA user-count zero crossing across the asynchronous worker boundary. Its negative control proves the pinned source loses a rapid STOP→START; the candidate must perform a full USB session kill/start and preserve all ordinary transition decisions. The module additionally builds against Ubuntu Linux 7.0 headers.

Hardware remains owner-verified with the exact Babyface Pro FS and buffer sequence in `verification.ownerCheck`.
