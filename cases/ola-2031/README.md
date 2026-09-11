# OLA Python client reconnect callback

This case covers [OLA issue #2031](https://github.com/OpenLightingProject/ola/issues/2031).
Applications using the convenient Python `ClientWrapper` had no way to receive
the close notification already supported by `OlaClient`, so an `olad` restart
could terminate or strand the client.

The candidate forwards the callback and makes socket teardown idempotent. BCL
executes the production wrapper with a controlled client seam and verifies the
one-shot teardown and regression-test contracts. Six upstream Python tests and
flake8 also passed against generated protobuf bindings.
