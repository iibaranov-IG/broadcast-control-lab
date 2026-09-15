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
| openmixercontrol-8 | [Issue](https://github.com/OpenMixerProject/OpenMixerControl/issues/8) | [PR](https://github.com/OpenMixerProject/OpenMixerControl/pull/91) | open | none | NOT_BOUND | 2 | NOT_REVIEWED | 2026-09-15T21:30:36.414Z |
| openmixercontrol-54 | [Issue](https://github.com/OpenMixerProject/OpenMixerControl/issues/54) | [PR](https://github.com/OpenMixerProject/OpenMixerControl/pull/92) | open | none | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-15T21:30:40.839Z |
| wirelessboard-93 | [Issue](https://github.com/willcgage/wirelessboard/issues/93) | [PR](https://github.com/willcgage/wirelessboard/pull/103) | open | none | NOT_BOUND | 2 | NOT_REVIEWED | 2026-09-15T21:30:44.461Z |
| network-audio-controller-55 | [Issue](https://github.com/chris-ritsen/network-audio-controller/issues/55) | [PR](https://github.com/chris-ritsen/network-audio-controller/pull/58) | open | none | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-15T21:30:47.945Z |
| network-audio-controller-47 | [Issue](https://github.com/chris-ritsen/network-audio-controller/issues/47) | [PR](https://github.com/chris-ritsen/network-audio-controller/pull/57) | open | none | NOT_BOUND | 4 | NOT_REVIEWED | 2026-09-15T21:30:51.388Z |
| jammernetz-35 | [Issue](https://github.com/christofmuc/JammerNetz/issues/35) | [PR](https://github.com/christofmuc/JammerNetz/pull/108) | open | success | NOT_BOUND | 41 | NOT_REVIEWED | 2026-09-15T21:30:54.808Z |
| low-latency-audio-32 | [Issue](https://github.com/microsoft/low-latency-audio/issues/32) | [PR](https://github.com/microsoft/low-latency-audio/pull/35) | merged | success | NOT_BOUND | 4 | NOT_REVIEWED | 2026-09-15T21:30:58.349Z |
| dometools-47 | [Issue](https://github.com/prefrontalcortex/DomeTools/issues/47) | [PR](https://github.com/prefrontalcortex/DomeTools/pull/49) | open | none | NOT_BOUND | 12 | NOT_REVIEWED | 2026-09-15T21:31:01.889Z |
| wirelessboard-92 | [Issue](https://github.com/willcgage/wirelessboard/issues/92) | [PR](https://github.com/willcgage/wirelessboard/pull/101) | open | none | NOT_BOUND | 5 | NOT_REVIEWED | 2026-09-15T21:31:05.297Z |
| ipcamlapse-33 | [Issue](https://github.com/KalyteraSystems/IPCamLapse/issues/33) | [PR](https://github.com/KalyteraSystems/IPCamLapse/pull/50) | open | success | NOT_BOUND | 6 | NOT_REVIEWED | 2026-09-15T21:31:08.751Z |
| midimonster-150 | [Issue](https://github.com/cbdevnet/midimonster/issues/150) | [PR](https://github.com/cbdevnet/midimonster/pull/151) | open | none | NOT_BOUND | 0 | NOT_REVIEWED | 2026-09-15T21:31:13.154Z |
| fader-x-5 | [Issue](https://github.com/stagehacks/FADER_X/issues/5) | [PR](https://github.com/stagehacks/FADER_X/pull/8) | open | none | NOT_BOUND | 4 | NOT_REVIEWED | 2026-09-15T21:31:16.659Z |
| ola-1995 | [Issue](https://github.com/OpenLightingProject/ola/issues/1995) | [PR](https://github.com/OpenLightingProject/ola/pull/2074) | open | none | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-15T21:31:20.209Z |
| cameractrls-118 | [Issue](https://github.com/soyersoyer/cameractrls/issues/118) | [PR](https://github.com/soyersoyer/cameractrls/pull/119) | open | none | NOT_BOUND | 0 | NOT_REVIEWED | 2026-09-15T21:31:23.974Z |
| streamlib-2241 | [Issue](https://github.com/tatolab/streamlib/issues/2241) | [PR](https://github.com/tatolab/streamlib/pull/2257) | open | success | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-15T21:31:27.271Z |
| srctools-51 | [Issue](https://github.com/TeamSpen210/srctools/issues/51) | [PR](https://github.com/TeamSpen210/srctools/pull/52) | open | none | NOT_BOUND | 0 | NOT_REVIEWED | 2026-09-15T21:31:30.513Z |
| majestic-webui-477 | [Issue](https://github.com/OpenIPC/majestic-webui/issues/477) | [PR](https://github.com/OpenIPC/majestic-webui/pull/481) | merged | success | STALE | 6 | NOT_REVIEWED | 2026-09-15T21:31:33.928Z |
| thingino-firmware-1655 | [Issue](https://github.com/themactep/thingino-firmware/issues/1655) | [PR](https://github.com/themactep/thingino-onvif/pull/9) | open | none | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-15T21:31:37.442Z |
| open-nvr-468 | [Issue](https://github.com/open-nvr/open-nvr/issues/468) | [PR](https://github.com/open-nvr/open-nvr/pull/470) | merged | success | NOT_BOUND | 7 | NOT_REVIEWED | 2026-09-15T21:31:40.796Z |
| reolink-aio-204 | [Issue](https://github.com/starkillerOG/reolink_aio/issues/204) | [PR](https://github.com/starkillerOG/reolink_aio/pull/206) | open | none | NOT_BOUND | 3 | NOT_REVIEWED | 2026-09-15T21:31:44.234Z |
| linux-show-player-398 | [Issue](https://github.com/FrancescoCeruti/linux-show-player/issues/398) | [PR](https://github.com/FrancescoCeruti/linux-show-player/pull/400) | draft | success | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-15T21:31:47.754Z |
| lba2-classic-community-674 | [Issue](https://github.com/LBALab/lba2-classic-community/issues/674) | [PR](https://github.com/LBALab/lba2-classic-community/pull/675) | merged | success | NOT_BOUND | 3 | NOT_REVIEWED | 2026-09-15T21:31:51.123Z |
| fpp-2957 | [Issue](https://github.com/FalconChristmas/fpp/issues/2957) | [PR](https://github.com/FalconChristmas/fpp/pull/2958) | merged | none | NOT_BOUND | 5 | NOT_REVIEWED | 2026-09-15T21:31:54.588Z |
| babyface-pro-linux-5 | [Issue](https://github.com/ismail-bahloul/babyface-pro-linux/issues/5) | [PR](https://github.com/ismail-bahloul/babyface-pro-linux/pull/6) | draft | none | BOUND_CANDIDATE | 5 | NOT_REVIEWED | 2026-09-15T21:31:57.759Z |
| linux-show-player-399 | [Issue](https://github.com/FrancescoCeruti/linux-show-player/issues/399) | [PR](https://github.com/FrancescoCeruti/linux-show-player/pull/401) | draft | success | BOUND_CANDIDATE | 4 | NOT_REVIEWED | 2026-09-15T21:32:01.163Z |
| zha-device-handlers-5329 | [Issue](https://github.com/zigpy/zha-device-handlers/issues/5329) | [PR](https://github.com/zigpy/zha-device-handlers/pull/5343) | draft | success | BOUND_CANDIDATE | 3 | NOT_REVIEWED | 2026-09-15T21:32:04.734Z |
| feishin-2451 | [Issue](https://github.com/jeffvli/feishin/issues/2451) | [PR](https://github.com/jeffvli/feishin/pull/2464) | draft | success | STALE | 10 | NOT_REVIEWED | 2026-09-15T21:32:08.559Z |
| low-latency-audio-36 | [Issue](https://github.com/microsoft/low-latency-audio/issues/36) | [PR](https://github.com/microsoft/low-latency-audio/pull/37) | draft | success | BOUND_CANDIDATE | 2 | NOT_REVIEWED | 2026-09-15T21:32:12.025Z |
| yi-hack-v5-476 | [Issue](https://github.com/alienatedsec/yi-hack-v5/issues/476) | [PR](https://github.com/alienatedsec/yi-hack-v5/pull/478) | draft | none | BOUND_CANDIDATE | 2 | NOT_REVIEWED | 2026-09-15T21:32:15.702Z |
| thingino-firmware-1636 | [Issue](https://github.com/themactep/thingino-firmware/issues/1636) | [PR](https://github.com/themactep/thingino-firmware/pull/1656) | draft | success | STALE | 4 | NOT_REVIEWED | 2026-09-15T21:32:19.396Z |
| surge-8569 | [Issue](https://github.com/surge-synthesizer/surge/issues/8569) | [PR](https://github.com/surge-synthesizer/surge/pull/8572) | closed | none | BOUND_CANDIDATE | 7 | NOT_REVIEWED | 2026-09-15T21:32:22.806Z |
| open-apollo-20 | [Issue](https://github.com/rolotrealanis98/open-apollo/issues/20) | [PR](https://github.com/rolotrealanis98/open-apollo/pull/83) | open | none | STALE | 3 | NOT_REVIEWED | 2026-09-15T21:32:26.381Z |
| amical-165 | [Issue](https://github.com/amicalhq/amical/issues/165) | [PR](https://github.com/amicalhq/amical/pull/184) | open | success | BOUND_CANDIDATE | 4 | NOT_REVIEWED | 2026-09-15T21:32:30.005Z |
| openmixercontrol-80 | [Issue](https://github.com/OpenMixerProject/OpenMixerControl/issues/80) | [PR](https://github.com/OpenMixerProject/OpenMixerControl/pull/93) | open | none | BOUND_CANDIDATE | 1 | NOT_REVIEWED | 2026-09-15T21:32:33.682Z |
| transcripted-1734 | [Issue](https://github.com/r3dbars/transcripted/issues/1734) | [PR](https://github.com/r3dbars/transcripted/pull/1735) | closed | none | BOUND_CANDIDATE | 3 | NOT_REVIEWED | 2026-09-15T21:32:37.152Z |
| camera-gallery-card-237 | [Issue](https://github.com/TheScubaDiver/camera-gallery-card/issues/237) | [PR](https://github.com/TheScubaDiver/camera-gallery-card/pull/238) | open | success | NOT_BOUND | 0 | NOT_REVIEWED | 2026-09-15T21:32:40.347Z |
| noisy-studio-99 | [Issue](https://github.com/noisy/noisy-studio/issues/99) | [PR](https://github.com/noisy/noisy-studio/pull/103) | open | none | BOUND_CANDIDATE | 0 | NOT_REVIEWED | 2026-09-15T21:32:44.383Z |
| blueye-sdk-225 | [Issue](https://github.com/BluEye-Robotics/blueye.sdk/issues/225) | [PR](https://github.com/BluEye-Robotics/blueye.sdk/pull/226) | closed | none | BOUND_CANDIDATE | 1 | NOT_REVIEWED | 2026-09-15T21:32:47.623Z |
| rmfakecloud-485 | [Issue](https://github.com/ddvk/rmfakecloud/issues/485) | [PR](https://github.com/ddvk/rmfakecloud/pull/486) | closed | none | BOUND_CANDIDATE | 1 | NOT_REVIEWED | 2026-09-15T21:32:51.283Z |
| esp-osc-2 | [Issue](https://github.com/256dpi/esp-osc/issues/2) | [PR](https://github.com/256dpi/esp-osc/pull/3) | open | none | BOUND_CANDIDATE | 0 | NOT_REVIEWED | 2026-09-15T21:32:54.870Z |
| nora-997 | [Issue](https://github.com/getnora-io/nora/issues/997) | [PR](https://github.com/getnora-io/nora/pull/998) | open | none | NOT_BOUND | 0 | NOT_REVIEWED | 2026-09-15T21:32:58.329Z |
| reolink-native-linux-7 | [Issue](https://github.com/TodesengelX/reolink-native-linux/issues/7) | [PR](https://github.com/TodesengelX/reolink-native-linux/pull/8) | open | none | NOT_BOUND | 0 | NOT_REVIEWED | 2026-09-15T21:33:02.253Z |
| dualsense-tester-222 | [Issue](https://github.com/daidr/dualsense-tester/issues/222) | [PR](https://github.com/daidr/dualsense-tester/pull/223) | merged | failure | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-15T21:33:05.597Z |
| psychopy-7777 | [Issue](https://github.com/psychopy/psychopy/issues/7777) | [PR](https://github.com/psychopy/psychopy/pull/7778) | open | success | NOT_BOUND | 1 | NOT_REVIEWED | 2026-09-15T21:33:08.654Z |
| kalico-970 | [Issue](https://github.com/KalicoCrew/kalico/issues/970) | [PR](https://github.com/KalicoCrew/kalico/pull/971) | closed | success | BOUND_CANDIDATE | 1 | NOT_REVIEWED | 2026-09-15T21:33:12.096Z |
| uttrflow-555 | [Issue](https://github.com/uttrflow/uttrflow-swift/issues/555) | [PR](https://github.com/uttrflow/uttrflow-swift/pull/800) | merged | success | STALE | 13 | NOT_REVIEWED | 2026-09-15T21:33:15.891Z |
| paella-984 | [Issue](https://github.com/polimediaupv/paella/issues/984) | [PR](https://github.com/opencast/opencast/pull/8017) | open | failure | BOUND_CANDIDATE | 1 | NOT_REVIEWED | Sync failed; prior data retained |
| sendspin-54 | [Issue](https://github.com/Sendspin/sendspin-cpp-cli/issues/54) | [PR](https://github.com/Sendspin/sendspin-cpp-cli/pull/55) | draft | success | STALE | 9 | NOT_REVIEWED | 2026-09-15T21:33:21.137Z |
| openterface-642 | [Issue](https://github.com/TechxArtisanStudio/Openterface_QT/issues/642) | [PR](https://github.com/TechxArtisanStudio/Openterface_QT/pull/643) | draft | none | BOUND_CANDIDATE | 1 | NOT_REVIEWED | 2026-09-15T21:33:24.741Z |
| node-av-349 | [Issue](https://github.com/seydx/node-av/issues/349) | [PR](https://github.com/seydx/node-av/pull/350) | draft | none | BOUND_CANDIDATE | 0 | NOT_REVIEWED | 2026-09-15T21:33:28.515Z |
| naudio-107 | [Issue](https://github.com/KJ5HST-LABS/naudio/issues/107) | [PR](https://github.com/KJ5HST-LABS/naudio/pull/108) | closed | none | BOUND_CANDIDATE | 2 | NOT_REVIEWED | 2026-09-15T21:33:31.878Z |
| chime-tts-339 | [Issue](https://github.com/nimroddolev/chime_tts/issues/339) | [PR](https://github.com/nimroddolev/chime_tts/pull/340) | merged | success | BOUND_CANDIDATE | 3 | NOT_REVIEWED | 2026-09-15T21:33:35.291Z |
| advanced-camera-card-2794 | [Issue](https://github.com/dermotduffy/advanced-camera-card/issues/2794) | [PR](https://github.com/dermotduffy/advanced-camera-card/pull/2797) | draft | failure | BOUND_CANDIDATE | 4 | NOT_REVIEWED | 2026-09-15T21:33:38.619Z |
| logic-pro-mcp-38 | [Issue](https://github.com/koltyj/logic-pro-mcp/issues/38) | [PR](https://github.com/koltyj/logic-pro-mcp/pull/42) | open | success | BOUND_CANDIDATE | 3 | NOT_REVIEWED | 2026-09-15T21:33:42.114Z |
| audacity-12147 | [Issue](https://github.com/audacity/audacity/issues/12147) | [PR](https://github.com/audacity/audacity/pull/12148) | open | none | BOUND_CANDIDATE | 3 | NOT_REVIEWED | 2026-09-15T21:33:45.973Z |
| pipewirecontroller-19 | [Issue](https://github.com/knightinfected/PipeWireController/issues/19) | [PR](https://github.com/knightinfected/PipeWireController/pull/20) | open | none | BOUND_CANDIDATE | 1 | NOT_REVIEWED | 2026-09-15T21:33:49.701Z |
| tonepush-9 | [Issue](https://github.com/crmne/tonepush/issues/9) | [PR](https://github.com/crmne/tonepush/pull/12) | open | success | BOUND_CANDIDATE | 5 | NOT_REVIEWED | 2026-09-15T21:33:53.264Z |
| scribe-worker-49 | [Issue](https://github.com/SUNET/scribe-worker/issues/49) | [PR](https://github.com/SUNET/scribe-worker/pull/50) | open | none | BOUND_CANDIDATE | 1 | NOT_REVIEWED | 2026-09-15T21:33:56.939Z |

Hardware status records an explicitly imported report; comments never grant hardware verification.
<!-- BCL:TRACKING:END -->
