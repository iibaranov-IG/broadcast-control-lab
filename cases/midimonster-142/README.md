# Encode sACN discovery universe lists correctly

Issue: https://github.com/cbdevnet/midimonster/issues/142

Candidate: https://github.com/cbdevnet/midimonster/pull/152

The case verifies multiple nonadjacent structure entries as exact network-order bytes, catching both the original host-order encoding and the incorrect struct-array memcpy stride.
