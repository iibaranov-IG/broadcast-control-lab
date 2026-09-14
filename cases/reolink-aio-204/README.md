# Reolink multi-lens detection capabilities

This case covers [reolink_aio issue #204](https://github.com/starkillerOG/reolink_aio/issues/204).

The unchanged regression fails on the pinned source because a stream-only second lens is skipped unless its model appears in a two-entry allowlist. The repair reads the Baichuan `motion` and `aitype` bits for every stream, then verifies capability creation, live event state updates and the negative unadvertised-stream case.

Hardware validation remains with the two current camera owners. See the generated hardware kit for exact steps.
