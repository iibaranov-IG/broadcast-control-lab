# Keep nested Opus option lookups in separate hash tables

Issue: https://github.com/sipwise/rtpengine/issues/2172

BCL generates the same constant-string hash source as the rtpengine build. The negative control proves `vbr` and `packet_loss` are absent from the outer table before the repair. The candidate check confirms both tables and executes the project's focused C test.
