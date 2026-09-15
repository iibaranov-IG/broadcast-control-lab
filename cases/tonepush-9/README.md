# HX Effects four-slot preset banks

This case covers item 4 of [TonePush issue #9](https://github.com/crmne/tonepush/issues/9).

The pinned baseline treats every device as three presets per bank, so HX Effects index 104 becomes `35C` and `27A` resolves to index 78. The candidate makes bank geometry part of the device profile and uses it consistently in the protocol helpers, CLI, GUI and backup extraction.
