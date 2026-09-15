# Openterface CH9329 persistent baudrate

Reproduces [issue #642](https://github.com/TechxArtisanStudio/Openterface_QT/issues/642) at the reporter's exact revision and validates [PR #643](https://github.com/TechxArtisanStudio/Openterface_QT/pull/643).

The WCH protocol distinguishes values returned when hardware pins select a serial mode (`0x80`-`0x82`) from the writable software modes accepted by `CMD_SET_PARA_CFG` (`0x00`-`0x02`). The baseline writes `0x80` in both baudrate packets and continues after any nonempty response. The candidate writes protocol mode `0x00` and validates the response command, status and checksum before reset. The complete Ubuntu/Qt6 application build and five focused Qt tests pass. Physical power-cycle validation remains assigned to the CH9329 owner.
