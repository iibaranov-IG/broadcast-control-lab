# naudio #107 — keep USB audio choices stable across renumbering

The control page saved PortAudio enumeration ids. Those positions change when another USB,
Bluetooth, or display device appears or disappears, so the next daemon start could silently open
the laptop microphone or room speakers instead of the radio interface.

The candidate stores the selected device's name pattern and clears its transient id. Existing
id-based files still display their current device and migrate on the next save. A missing saved
device is shown as unresolved. Direct command-line id selection remains supported.
