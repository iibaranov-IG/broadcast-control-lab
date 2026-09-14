# Microsoft Low-Latency Audio #36

This case covers a USB Audio 2 input behind a Selector Unit that works for capture but is shown as unavailable by the Windows legacy sound panel.

The baseline advertises hardware jack detection for a USB terminal without connector control. The candidate makes that dummy jack static and keeps detection on the real connector-controlled path.

The source regression is independent of the Windows UI. A driver build and test on the reporter's Sound Blaster G3 remain required before full application qualification.
