# Starting or stopping a camera recording stops an ongoing multibeam recording

The baseline drops the `RecordOn.multibeam` bit whenever either camera starts or
stops recording. The focused regression seeds active multibeam telemetry and
checks both camera call paths plus the serialized control message. Those exact
tests fail on the pinned baseline and pass after the two-method repair.

The complete non-hardware upstream suite is also executed. Physical drone
validation remains with the owner because BCL cannot start a real multibeam
recording.
