# Surge XT MTS-ESP channel period repair

Issue: https://github.com/surge-synthesizer/surge/issues/8569

When MIDI channels select tuning periods, the old MTS path uses map size as a semitone distance. A source with no map reports `-1`, so channel 2 moves down one semitone; a non-octave source such as Bohlen-Pierce moves by the wrong interval.

The candidate delegates to `SurgeStorage::tuningPeriodSemitones()`, which already returns the MTS-ESP source period and preserves the existing internal-tuning rules. The added upstream C++ regression captures the missing-map failure as 59 before and 72 after the repair.

BCL's portable check proves the exact source and test contract. Separately, the actual Release test runner was built on macOS arm64: the negative control failed 59 versus 72, the candidate passed, and the complete `[tun]` suite passed 61,304 assertions across 20 cases. GitHub's upstream PR CI will repeat compilation and tests across its supported runners.
