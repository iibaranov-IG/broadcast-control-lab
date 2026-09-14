# DualSense audio volume range

[Issue #222](https://github.com/daidr/dualsense-tester/issues/222) reports that audio file playback shows 0–255 while the speaker stops changing at 100. The pinned baseline forwards that UI value directly into target-specific HID fields.

BCL first proves the shared converter is absent on the baseline, then applies the candidate and checks the percentage endpoints, headphone scaling, clamping, USB integration, Bluetooth integration, DualSense, and DualSense Edge.

The reporter's controller remains the final check for perceived loudness and macOS output-device volume.
