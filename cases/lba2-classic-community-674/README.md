# Android BIN/CUE discovery in the documented data folder

Reproduces [LBALab/lba2-classic-community#674](https://github.com/LBALab/lba2-classic-community/issues/674) at pinned revision `069138f56515f7679bfb2b897bee16b1a77edfe4`.

The baseline rejects a folder containing only a supported disc image at both
documented app-specific Android paths. The repair enables the existing
image-aware discovery predicate for those two paths while leaving the broad
shared-storage probes unchanged. Final Android arm64 validation remains with
the reporter's BIN/CUE fixture.
