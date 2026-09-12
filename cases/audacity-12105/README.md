# Restore AUP4 files in the Windows Save As dialog

Issue: https://github.com/audacity/audacity/issues/12105

The baseline creates one name filter with two separate parenthesized pattern groups. The candidate emits the standard single-group form `Audacity 4 files (*.aup4)` and shares the helper with the related duplicate-extension repair.
