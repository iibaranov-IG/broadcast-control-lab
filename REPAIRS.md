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
| openmixercontrol-8 | [Issue](https://github.com/OpenMixerProject/OpenMixerControl/issues/8) | [PR](https://github.com/OpenMixerProject/OpenMixerControl/pull/91) | open | none | NOT_BOUND | 2 | NOT_REVIEWED | 2026-09-14T14:15:07.095Z |
| openmixercontrol-54 | [Issue](https://github.com/OpenMixerProject/OpenMixerControl/issues/54) | [PR](https://github.com/OpenMixerProject/OpenMixerControl/pull/92) | open | none | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-14T14:15:10.138Z |
| wirelessboard-93 | [Issue](https://github.com/willcgage/wirelessboard/issues/93) | [PR](https://github.com/willcgage/wirelessboard/pull/103) | open | none | NOT_BOUND | 2 | NOT_REVIEWED | 2026-09-14T14:15:13.214Z |
| network-audio-controller-55 | [Issue](https://github.com/chris-ritsen/network-audio-controller/issues/55) | [PR](https://github.com/chris-ritsen/network-audio-controller/pull/58) | open | none | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-14T14:15:15.992Z |
| network-audio-controller-47 | [Issue](https://github.com/chris-ritsen/network-audio-controller/issues/47) | [PR](https://github.com/chris-ritsen/network-audio-controller/pull/57) | open | none | NOT_BOUND | 4 | NOT_REVIEWED | 2026-09-14T14:15:18.652Z |
| jammernetz-35 | [Issue](https://github.com/christofmuc/JammerNetz/issues/35) | [PR](https://github.com/christofmuc/JammerNetz/pull/108) | open | success | NOT_BOUND | 41 | NOT_REVIEWED | 2026-09-14T14:15:21.185Z |
| low-latency-audio-32 | [Issue](https://github.com/microsoft/low-latency-audio/issues/32) | [PR](https://github.com/microsoft/low-latency-audio/pull/35) | open | success | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-14T14:15:23.935Z |
| dometools-47 | [Issue](https://github.com/prefrontalcortex/DomeTools/issues/47) | [PR](https://github.com/prefrontalcortex/DomeTools/pull/49) | open | none | NOT_BOUND | 12 | NOT_REVIEWED | 2026-09-14T14:15:27.058Z |
| wirelessboard-92 | [Issue](https://github.com/willcgage/wirelessboard/issues/92) | [PR](https://github.com/willcgage/wirelessboard/pull/101) | open | none | NOT_BOUND | 5 | NOT_REVIEWED | 2026-09-14T14:15:29.714Z |
| ipcamlapse-33 | [Issue](https://github.com/KalyteraSystems/IPCamLapse/issues/33) | [PR](https://github.com/KalyteraSystems/IPCamLapse/pull/50) | open | success | NOT_BOUND | 6 | NOT_REVIEWED | 2026-09-14T14:15:32.322Z |
| midimonster-150 | [Issue](https://github.com/cbdevnet/midimonster/issues/150) | [PR](https://github.com/cbdevnet/midimonster/pull/151) | open | none | NOT_BOUND | 0 | NOT_REVIEWED | 2026-09-14T14:15:35.621Z |
| fader-x-5 | [Issue](https://github.com/stagehacks/FADER_X/issues/5) | [PR](https://github.com/stagehacks/FADER_X/pull/8) | open | none | NOT_BOUND | 4 | NOT_REVIEWED | 2026-09-14T14:15:38.367Z |
| ola-1995 | [Issue](https://github.com/OpenLightingProject/ola/issues/1995) | [PR](https://github.com/OpenLightingProject/ola/pull/2074) | open | none | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-14T14:15:40.997Z |
| cameractrls-118 | [Issue](https://github.com/soyersoyer/cameractrls/issues/118) | [PR](https://github.com/soyersoyer/cameractrls/pull/119) | open | none | NOT_BOUND | 0 | NOT_REVIEWED | 2026-09-14T14:15:43.925Z |
| streamlib-2241 | [Issue](https://github.com/tatolab/streamlib/issues/2241) | [PR](https://github.com/tatolab/streamlib/pull/2257) | open | success | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-14T14:15:46.303Z |
| srctools-51 | [Issue](https://github.com/TeamSpen210/srctools/issues/51) | [PR](https://github.com/TeamSpen210/srctools/pull/52) | open | none | NOT_BOUND | 0 | NOT_REVIEWED | 2026-09-14T14:15:49.019Z |
| majestic-webui-477 | [Issue](https://github.com/OpenIPC/majestic-webui/issues/477) | [PR](https://github.com/OpenIPC/majestic-webui/pull/481) | merged | success | STALE | 6 | NOT_REVIEWED | 2026-09-14T14:15:51.472Z |
| thingino-firmware-1655 | [Issue](https://github.com/themactep/thingino-firmware/issues/1655) | [PR](https://github.com/themactep/thingino-onvif/pull/9) | open | none | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-14T14:15:54.302Z |
| open-nvr-468 | [Issue](https://github.com/open-nvr/open-nvr/issues/468) | [PR](https://github.com/open-nvr/open-nvr/pull/470) | open | none | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-14T14:15:56.820Z |
| reolink-aio-204 | [Issue](https://github.com/starkillerOG/reolink_aio/issues/204) | [PR](https://github.com/starkillerOG/reolink_aio/pull/206) | open | none | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-14T14:15:59.496Z |
| linux-show-player-398 | [Issue](https://github.com/FrancescoCeruti/linux-show-player/issues/398) | [PR](https://github.com/FrancescoCeruti/linux-show-player/pull/400) | draft | success | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-14T14:16:02.166Z |
| lba2-classic-community-674 | [Issue](https://github.com/LBALab/lba2-classic-community/issues/674) | [PR](https://github.com/LBALab/lba2-classic-community/pull/675) | merged | success | NOT_BOUND | 3 | NOT_REVIEWED | 2026-09-14T14:16:04.956Z |
| fpp-2957 | [Issue](https://github.com/FalconChristmas/fpp/issues/2957) | [PR](https://github.com/FalconChristmas/fpp/pull/2958) | open | none | NOT_BOUND | 5 | NOT_REVIEWED | 2026-09-14T14:16:07.797Z |
| babyface-pro-linux-5 | [Issue](https://github.com/ismail-bahloul/babyface-pro-linux/issues/5) | [PR](https://github.com/ismail-bahloul/babyface-pro-linux/pull/6) | draft | none | BOUND_CANDIDATE | 1 | NOT_REVIEWED | 2026-09-14T14:16:10.724Z |
| linux-show-player-399 | [Issue](https://github.com/FrancescoCeruti/linux-show-player/issues/399) | [PR](https://github.com/FrancescoCeruti/linux-show-player/pull/401) | draft | success | BOUND_CANDIDATE | 3 | NOT_REVIEWED | 2026-09-14T14:16:13.367Z |
| zha-device-handlers-5329 | [Issue](https://github.com/zigpy/zha-device-handlers/issues/5329) | [PR](https://github.com/zigpy/zha-device-handlers/pull/5343) | draft | success | BOUND_CANDIDATE | 3 | NOT_REVIEWED | 2026-09-14T14:16:16.408Z |
| feishin-2451 | [Issue](https://github.com/jeffvli/feishin/issues/2451) | [PR](https://github.com/jeffvli/feishin/pull/2464) | draft | failure | STALE | 7 | NOT_REVIEWED | 2026-09-14T14:16:19.422Z |
| low-latency-audio-36 | [Issue](https://github.com/microsoft/low-latency-audio/issues/36) | [PR](https://github.com/microsoft/low-latency-audio/pull/37) | draft | success | BOUND_CANDIDATE | 1 | NOT_REVIEWED | 2026-09-14T14:16:21.973Z |
| yi-hack-v5-476 | [Issue](https://github.com/alienatedsec/yi-hack-v5/issues/476) | [PR](https://github.com/alienatedsec/yi-hack-v5/pull/478) | draft | none | BOUND_CANDIDATE | 2 | NOT_REVIEWED | 2026-09-14T14:16:24.677Z |
| thingino-firmware-1636 | [Issue](https://github.com/themactep/thingino-firmware/issues/1636) | [PR](https://github.com/themactep/thingino-firmware/pull/1656) | draft | success | BOUND_CANDIDATE | 3 | NOT_REVIEWED | 2026-09-14T14:16:27.475Z |
| surge-8569 | [Issue](https://github.com/surge-synthesizer/surge/issues/8569) | [PR](https://github.com/surge-synthesizer/surge/pull/8572) | closed | none | BOUND_CANDIDATE | 5 | NOT_REVIEWED | 2026-09-14T14:16:31.020Z |
| open-apollo-20 | [Issue](https://github.com/rolotrealanis98/open-apollo/issues/20) | [PR](https://github.com/rolotrealanis98/open-apollo/pull/83) | open | none | STALE | 3 | NOT_REVIEWED | 2026-09-14T14:16:33.495Z |
| amical-165 | [Issue](https://github.com/amicalhq/amical/issues/165) | [PR](https://github.com/amicalhq/amical/pull/184) | open | success | BOUND_CANDIDATE | 4 | NOT_REVIEWED | 2026-09-14T14:16:36.172Z |
| openmixercontrol-80 | [Issue](https://github.com/OpenMixerProject/OpenMixerControl/issues/80) | [PR](https://github.com/OpenMixerProject/OpenMixerControl/pull/93) | open | none | BOUND_CANDIDATE | 1 | NOT_REVIEWED | 2026-09-14T14:16:38.972Z |
| transcripted-1734 | [Issue](https://github.com/r3dbars/transcripted/issues/1734) | [PR](https://github.com/r3dbars/transcripted/pull/1735) | draft | none | BOUND_CANDIDATE | 1 | NOT_REVIEWED | 2026-09-14T14:16:41.615Z |
| camera-gallery-card-237 | [Issue](https://github.com/TheScubaDiver/camera-gallery-card/issues/237) | [PR](https://github.com/TheScubaDiver/camera-gallery-card/pull/238) | open | success | NOT_BOUND | 0 | NOT_REVIEWED | 2026-09-14T15:00:42.840Z |
| noisy-studio-99 | [Issue](https://github.com/noisy/noisy-studio/issues/99) | [PR](https://github.com/noisy/noisy-studio/pull/103) | open | unknown | BOUND_CANDIDATE | 0 | NOT_REVIEWED | Not synced |
| blueye-sdk-225 | [Issue](https://github.com/BluEye-Robotics/blueye.sdk/issues/225) | [PR](https://github.com/BluEye-Robotics/blueye.sdk/pull/226) | open | unknown | BOUND_CANDIDATE | 0 | NOT_REVIEWED | Not synced |

Hardware status records an explicitly imported report; comments never grant hardware verification.
<!-- BCL:TRACKING:END -->
