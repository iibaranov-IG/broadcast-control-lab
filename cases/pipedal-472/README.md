# PiPedal Bluetooth MIDI reconnect

This case covers [PiPedal issue #472](https://github.com/rerdavies/pipedal/issues/472).
ALSA can announce a recreated Bluetooth client before that client's MIDI port
exists. PiPedal currently re-applies its saved configuration on the client
event, finds no matching port, and never retries when the port is ready.

The repair also treats `SND_SEQ_EVENT_PORT_START` as a device-added signal. BCL
models the real event order, verifies stable name-based matching, and checks the
production monitor-to-reconfiguration path. A Raspberry Pi owner must still
perform the Bluetooth power-cycle check.
