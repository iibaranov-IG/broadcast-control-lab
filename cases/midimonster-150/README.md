# MIDIMonster value-less OSC query

This case covers [MIDIMonster issue #150](https://github.com/cbdevnet/midimonster/issues/150).
It builds the real core and OSC backend, routes a loopback trigger into a mixer
query, and captures the exact outgoing datagram. A control check confirms that
ordinary float output keeps its existing wire format.

The automated result establishes the protocol behavior only. A mixer owner must
confirm the returned state on an XAir or X32 device.
