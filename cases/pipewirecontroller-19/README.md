# Live PipeWire device controls

This case covers [PipeWireController issue #19](https://github.com/knightinfected/PipeWireController/issues/19).

The pinned baseline never refreshes the Devices page after it opens. The candidate polls while that page is visible and updates the existing volume/mute widgets, while protecting a recent local drag and rebuilding only after node membership or identity changes.
