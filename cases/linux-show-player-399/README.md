# Linux Show Player JACK route preservation

This case covers [Linux Show Player issue #399](https://github.com/FrancescoCeruti/linux-show-player/issues/399).

The unchanged implementation disconnects every live JACK route before it learns that a configured destination is absent, then logs a full traceback when reconnection fails. The repair reconciles one output at a time: incomplete destination sets retain their current live route, while complete sets replace it with the saved route. Expected JACK connection errors are reported as concise warnings.

The deterministic test covers an absent hardware/mixer port, its later return, and a failed JACK connect call. The reporter's Linux/JACK setup remains the final live application check.
