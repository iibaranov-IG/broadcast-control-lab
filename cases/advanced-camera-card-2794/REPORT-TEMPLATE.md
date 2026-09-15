# Reproduction

At v8.1.0, force mandatory initialization to remain pending after the card has
rendered. The card removes `advanced-camera-card-elements`, which also delays the
custom menu buttons dispatched by those elements.

# Repair

Gate configured elements on the template renderer only when the effective
configuration contains templates. Non-template elements render independently of
camera, microphone, view, and trigger initialization.

# Owner checks

Load the issue configuration on an affected wall tablet and reload the dashboard.
Confirm the Reload and entity-state menu icons appear immediately while the
go2rtc stream and two-way audio continue starting.
