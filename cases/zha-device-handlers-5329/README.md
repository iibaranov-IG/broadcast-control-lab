# HOBEIAN ZG-305Z dual USB switch

This case covers [zha-device-handlers issue #5329](https://github.com/zigpy/zha-device-handlers/issues/5329).

The device reports its independently switched USB-C and USB-A outputs as lights. The repair adds a declarative ZHA quirk that keeps both endpoints and changes their device type to `ON_OFF_OUTPUT`, allowing ZHA to discover them as switches. Upstream unit and registry suites passed; the reporter's physical device remains the final endpoint-mapping check.

