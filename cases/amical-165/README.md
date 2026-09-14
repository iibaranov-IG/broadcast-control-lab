# Amical multichannel audio-interface capture repair

Issue: https://github.com/amicalhq/amical/issues/165

Amical requested a mono stream and its AudioWorklet copied only channel 1. An Apollo Twin owner with a microphone on input 2 therefore received near-silent WAV files and no transcription.

The candidate initially requests stereo, expands the track to the device's reported maximum channel count, keeps channels discrete through the Web Audio graph, and selects the channel with the greatest mean-square signal in each render quantum. A single active microphone is copied without attenuation, while existing mono devices keep the same samples.

BCL executes the real AudioWorklet with synthetic multichannel buffers and verifies the capture constraints. The upstream desktop suite separately passed 1,253 tests. Physical Apollo/BlackHole validation remains with the issue owner.
