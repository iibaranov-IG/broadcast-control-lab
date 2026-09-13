# Repair board

Updated 2026-09-11.

| Area | User problem | Source | Repair | Status |
| --- | --- | --- | --- | --- |
| Digital mixing | Stereo pairs consume two strips and lack linked routing and controls | [OpenMixerControl #8](https://github.com/OpenMixerProject/OpenMixerControl/issues/8) | [PR #91](https://github.com/OpenMixerProject/OpenMixerControl/pull/91) | In review; PC build and 63 assertions pass; hardware check invited |
| Digital mixing | Main Select LED lights after changing fader layers | [OpenMixerControl #54](https://github.com/OpenMixerProject/OpenMixerControl/issues/54) | [PR #92](https://github.com/OpenMixerProject/OpenMixerControl/pull/92) | In review; PC build and 42 assertions pass; hardware check invited |
| Wireless microphones | Audio-Technica receivers are unsupported | [wirelessboard #93](https://github.com/willcgage/wirelessboard/issues/93) | [PR #103](https://github.com/willcgage/wirelessboard/pull/103) | In review; 480 automated tests pass; hardware check invited |
| Audio-over-IP | Biamp and Shure receiver-flow packets are rejected | [network-audio-controller #55](https://github.com/chris-ritsen/network-audio-controller/issues/55) | [PR #58](https://github.com/chris-ritsen/network-audio-controller/pull/58) | In review; 342 tests pass; packet or hardware check invited |
| Audio-over-IP | DHCP gateway and DNS addresses appear swapped | [network-audio-controller #47](https://github.com/chris-ritsen/network-audio-controller/issues/47) | [PR #57](https://github.com/chris-ritsen/network-audio-controller/pull/57) | In review; parser tests pass; device check invited |
| USB audio | Yamaha Steinberg ASIO opens but JammerNetz cannot start duplex audio | [JammerNetz #35](https://github.com/christofmuc/JammerNetz/issues/35) | [PR #108](https://github.com/christofmuc/JammerNetz/pull/108) | In review; 108 tests and CodeRabbit pass; Windows hardware check invited |
| USB audio | Long ASIO channel names crash the host application | [low-latency-audio #32](https://github.com/microsoft/low-latency-audio/issues/32) | [PR #35](https://github.com/microsoft/low-latency-audio/pull/35) | In review; Microsoft CLA check passes; Windows build needed |
| NDI | DomeTools installs video-only KlakNDI and shows no audio controls | [DomeTools #47](https://github.com/prefrontalcortex/DomeTools/issues/47) | [PR #49](https://github.com/prefrontalcortex/DomeTools/pull/49) | In review; reporter confirmed NDI audio on Quest 3 |
| Wireless microphones | Sennheiser SSCv2 data has no vendor-neutral mapping | [wirelessboard #92](https://github.com/willcgage/wirelessboard/issues/92) | [PR #101](https://github.com/willcgage/wirelessboard/pull/101) | In review; 476 automated tests pass; transport capture needed |
| IP cameras | Schedules behave ambiguously around local time and DST | [IPCamLapse #33](https://github.com/KalyteraSystems/IPCamLapse/issues/33) | [PR #50](https://github.com/KalyteraSystems/IPCamLapse/pull/50) | Changes requested; all CI jobs pass; review follow-up needed |
| Digital mixing | XAir/X32 state queries cannot be sent without an OSC value | [MIDIMonster #150](https://github.com/cbdevnet/midimonster/issues/150) | [PR #151](https://github.com/cbdevnet/midimonster/pull/151) | In review; three offline protocol checks pass; mixer check invited |
| Motorized faders | X Air mode hides return targets and emits X32-only OSC addresses | [FADER_X #5](https://github.com/stagehacks/FADER_X/issues/5) | [PR #8](https://github.com/stagehacks/FADER_X/pull/8) | In review; three BCL checks pass; XR12/XR16/XR18 hardware check invited |
| Digital mixing | FADER_X emits X32-only OSC addresses for X Air returns | [FADER_X #5](https://github.com/stagehacks/FADER_X/issues/5) | [PR #8](https://github.com/stagehacks/FADER_X/pull/8) | In review; three BCL checks pass; XR12/XR16/XR18 hardware check invited |

<!-- BCL:TRACKING:START -->
## Automatically tracked repairs

| Case | Source | Repair | PR | CI | Evidence | Unread events | Hardware | Last read (UTC) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| openmixercontrol-8 | [Issue](https://github.com/OpenMixerProject/OpenMixerControl/issues/8) | [PR](https://github.com/OpenMixerProject/OpenMixerControl/pull/91) | open | none | NOT_BOUND | 2 | NOT_REVIEWED | 2026-09-13T01:10:03.018Z |
| openmixercontrol-54 | [Issue](https://github.com/OpenMixerProject/OpenMixerControl/issues/54) | [PR](https://github.com/OpenMixerProject/OpenMixerControl/pull/92) | open | none | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-13T01:10:06.711Z |
| wirelessboard-93 | [Issue](https://github.com/willcgage/wirelessboard/issues/93) | [PR](https://github.com/willcgage/wirelessboard/pull/103) | open | none | NOT_BOUND | 2 | NOT_REVIEWED | 2026-09-13T01:10:10.344Z |
| network-audio-controller-55 | [Issue](https://github.com/chris-ritsen/network-audio-controller/issues/55) | [PR](https://github.com/chris-ritsen/network-audio-controller/pull/58) | open | none | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-13T01:10:13.819Z |
| network-audio-controller-47 | [Issue](https://github.com/chris-ritsen/network-audio-controller/issues/47) | [PR](https://github.com/chris-ritsen/network-audio-controller/pull/57) | open | none | NOT_BOUND | 4 | NOT_REVIEWED | 2026-09-13T01:10:17.197Z |
| jammernetz-35 | [Issue](https://github.com/christofmuc/JammerNetz/issues/35) | [PR](https://github.com/christofmuc/JammerNetz/pull/108) | open | success | NOT_BOUND | 41 | NOT_REVIEWED | 2026-09-13T01:10:20.617Z |
| low-latency-audio-32 | [Issue](https://github.com/microsoft/low-latency-audio/issues/32) | [PR](https://github.com/microsoft/low-latency-audio/pull/35) | open | success | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-13T01:10:24.224Z |
| dometools-47 | [Issue](https://github.com/prefrontalcortex/DomeTools/issues/47) | [PR](https://github.com/prefrontalcortex/DomeTools/pull/49) | open | none | NOT_BOUND | 12 | NOT_REVIEWED | 2026-09-13T01:10:27.875Z |
| wirelessboard-92 | [Issue](https://github.com/willcgage/wirelessboard/issues/92) | [PR](https://github.com/willcgage/wirelessboard/pull/101) | open | none | NOT_BOUND | 5 | NOT_REVIEWED | 2026-09-13T01:10:31.247Z |
| ipcamlapse-33 | [Issue](https://github.com/KalyteraSystems/IPCamLapse/issues/33) | [PR](https://github.com/KalyteraSystems/IPCamLapse/pull/50) | open | success | NOT_BOUND | 6 | NOT_REVIEWED | 2026-09-13T01:10:34.471Z |
| midimonster-150 | [Issue](https://github.com/cbdevnet/midimonster/issues/150) | [PR](https://github.com/cbdevnet/midimonster/pull/151) | open | none | NOT_BOUND | 0 | NOT_REVIEWED | 2026-09-13T01:10:38.407Z |
| fader-x-5 | [Issue](https://github.com/stagehacks/FADER_X/issues/5) | [PR](https://github.com/stagehacks/FADER_X/pull/8) | open | none | NOT_BOUND | 4 | NOT_REVIEWED | 2026-09-13T01:10:41.879Z |

Hardware status records an explicitly imported report; comments never grant hardware verification.
<!-- BCL:TRACKING:END -->
