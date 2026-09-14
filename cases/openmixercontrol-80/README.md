# OpenMixerControl #80

The baseline exposes `Volume::SetFadervalue(float)` even though the physical surface and the conversion helper use a 12-bit `uint16_t` raw value. The repair makes the setter contract explicit and removes the implicit narrowing conversion.

BCL demonstrates the mismatch on the pinned baseline and the corrected contract on the candidate. Physical console validation remains owner-operated.
