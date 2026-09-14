# Uttrflow permission recovery

This case validates [Uttrflow issue #555](https://github.com/uttrflow/uttrflow-swift/issues/555) at `8d93f5b8574f3c7b8c30086d9c817bf7f5d4827d` and the existing candidate in [PR #800](https://github.com/uttrflow/uttrflow-swift/pull/800).

The unchanged upstream tests fail to compile against the baseline because the Settings-aware microphone recovery and shared pane opener do not exist. The candidate's real permission modules pass 18 focused Swift tests locally. The portable BCL check independently proves that the published source routes denied and restricted microphone states, preserves the first permission prompt, sends Apple Intelligence to its own pane, and keeps all pane addresses in one helper.

The repository requires Swift 6.3/Xcode 26.6 for its complete gate. Those workflows are awaiting the maintainer approval required by GitHub for a first-time fork contribution; the portable source contract does not replace that build.
