# BCL showcase: ten repairs worth presenting

These are the ten strongest current candidates for the public BCL website. They
were selected for a clear user-visible failure, relevance to broadcast or AV
hardware, a focused repair, and evidence that can be explained without asking a
visitor to trust the author.

The website must distinguish a **verified result** from a **candidate repair**.
A case becomes a verified result only after an upstream merge, an explicit report
from the affected system owner, or both. Passing offline tests is valuable
engineering evidence, but is not presented as physical hardware verification.

## 1. Restore NDI audio in DomeTools

- Pain: the documented installer exposed video but no NDI audio controls.
- Repair: correct the KlakNDI package integration used by DomeTools.
- Evidence: the affected user confirmed NDI audio on a Quest 3.
- Links: [issue](https://github.com/prefrontalcortex/DomeTools/issues/47), [repair](https://github.com/prefrontalcortex/DomeTools/pull/49)
- Showcase state: **verified by the affected user**.

## 2. Make OpenIPC firmware diagnostics readable

- Pain: firmware upgrade failures arrived as text frames, but the web interface
  treated every socket message as binary and hid the diagnostic.
- Repair: render textual upgrade messages while retaining binary progress data.
- Evidence: upstream CI passed and the repair was merged.
- Links: [issue](https://github.com/OpenIPC/majestic-webui/issues/477), [merged repair](https://github.com/OpenIPC/majestic-webui/pull/481)
- Showcase state: **merged upstream**.

## 3. Give a digital mixer real stereo strips

- Pain: linked input, bus, and matrix pairs consumed two strips and behaved as
  unrelated mono paths in routing and control views.
- Repair: add paired routing, stereo pan/width, labels, and one-strip presentation.
- Evidence: the desktop build and 63 assertions pass.
- Links: [issue](https://github.com/OpenMixerProject/OpenMixerControl/issues/8), [repair](https://github.com/OpenMixerProject/OpenMixerControl/pull/91)
- Showcase state: candidate; needs mixer-owner validation or merge.

## 4. Add Audio-Technica wireless receivers to WirelessBoard

- Pain: supported wireless systems could not monitor Audio-Technica network
  receivers.
- Repair: implement the documented TCP protocol and map channel name, battery,
  RF/audio levels, antenna, lock state, and frequency for five receiver models.
- Evidence: 480 automated tests pass against the protocol model.
- Links: [issue](https://github.com/willcgage/wirelessboard/issues/93), [repair](https://github.com/willcgage/wirelessboard/pull/103)
- Showcase state: candidate; rebase and obtain a receiver capture or hardware test.

## 5. Decode Biamp and Shure audio-network flows

- Pain: receiver-flow packets from Biamp Tesira and Shure MXWANI4 devices were
  rejected, leaving valid audio routes invisible.
- Repair: support the devices' descriptor layouts and boundary-crossing length.
- Evidence: 342 parser and application tests pass with regression packets.
- Links: [issue](https://github.com/chris-ritsen/network-audio-controller/issues/55), [repair](https://github.com/chris-ritsen/network-audio-controller/pull/58)
- Showcase state: candidate; rebase and obtain a packet capture or device test.

## 6. Start duplex ASIO audio on Yamaha Steinberg hardware

- Pain: the ASIO driver opened on Windows, but JammerNetz could not start duplex
  audio with the interface's supported channel layout.
- Repair: negotiate the usable input/output arrangement instead of assuming a
  symmetric layout.
- Evidence: 108 tests and upstream CI pass.
- Links: [issue](https://github.com/christofmuc/JammerNetz/issues/35), [repair](https://github.com/christofmuc/JammerNetz/pull/108)
- Showcase state: candidate; needs the reporter's Windows hardware retest or merge.

## 7. Restore preset controls on a YI Dome camera

- Pain: Add Preset, Delete Preset, and Delete All buttons were visible but sent no
  request on the reported YI Dome 63US firmware.
- Repair: connect the three controls to the existing camera request functions.
- Evidence: BCL proves the baseline has no handlers and the candidate emits the
  exact three CGI requests.
- Links: [issue](https://github.com/alienatedsec/yi-hack-v5/issues/476), [repair](https://github.com/alienatedsec/yi-hack-v5/pull/478)
- Showcase state: candidate; needs the camera owner's movement and persistence test.

## 8. Keep USB audio inputs selectable on Windows

- Pain: Sound Blaster G3 inputs appeared unavailable because a software-only ACX
  endpoint claimed hardware jack-detection capability.
- Repair: mark endpoints without connector-control hardware as static while
  retaining real detection on physical connector paths.
- Evidence: focused baseline/candidate checks pass and the Microsoft CLA check is
  complete.
- Links: [issue](https://github.com/microsoft/low-latency-audio/issues/36), [repair](https://github.com/microsoft/low-latency-audio/pull/37)
- Showcase state: candidate; needs a Windows driver build and G3 device test.

## 9. Recover ONVIF cameras that require PasswordDigest

- Pain: an NVR stopped at an ONVIF authentication fault even when the camera could
  be reached with the standard WS-Security digest flow.
- Repair: retry the authentication fault with PasswordDigest instead of abandoning
  camera discovery.
- Evidence: the BCL case exercises the authentication boundary and expected retry.
- Links: [issue](https://github.com/open-nvr/open-nvr/issues/468), [repair](https://github.com/open-nvr/open-nvr/pull/470)
- Showcase state: candidate; needs upstream review and the reporter's camera test.

## 10. Select a working PipeWire format for USB DACs

- Pain: Falcon Player assumed signed 16-bit audio even when a USB DAC advertised
  other valid formats, so playback could not start.
- Repair: choose a format the actual PipeWire node advertises.
- Evidence: the candidate is covered by the executable BCL case.
- Links: [issue](https://github.com/FalconChristmas/fpp/issues/2957), [repair](https://github.com/FalconChristmas/fpp/pull/2958)
- Showcase state: candidate; needs the affected DAC test or upstream merge.

## Publication order

Publish DomeTools and OpenIPC first. They already have the external proof that a
visitor can independently inspect. Keep the other eight in a “repairs in
validation” section until their stated gate is complete, then promote them one by
one. Each public card should show the symptom, one-sentence root cause, repair
diff, before/after evidence, upstream outcome, and the limits of verification.
