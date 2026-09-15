# Render camera-card menu elements during startup

Case for https://github.com/dermotduffy/advanced-camera-card/issues/2794.

Version 8 holds every configured picture element until camera, microphone,
view, and trigger initialization finish. Custom menu icons are picture elements,
so affected wall tablets show incomplete controls while go2rtc and two-way audio
start. The repair renders ordinary elements immediately and waits only when their
configuration actually needs the lazy template renderer.
