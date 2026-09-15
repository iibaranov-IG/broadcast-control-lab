# Audio-only Opencast events in Paella Player 8

Issue [polimediaupv/paella#984](https://github.com/polimediaupv/paella/issues/984) reports that an Opencast 21 audio-only event reaches Paella with an empty `streams` array.

The converter repair already exists in `@asicupv/paella-opencast-core` 2.0.3, but Opencast `develop` still locks 2.0.1. This case proves that the reported payload fails with the locked baseline and succeeds after advancing the minimum required dependency set. It also builds the complete player module.
