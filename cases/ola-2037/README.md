# OLA RDM LIST_INTERFACES deduplication

This case covers [OLA issue #2037](https://github.com/OpenLightingProject/ola/issues/2037).
Network managers may report more than one address for the same OS interface,
which previously produced duplicate interface indices in the E1.37-7 response.

The candidate sorts the interfaces and collapses equal indices before counting
and packing them. BCL compiles a deterministic response model and checks the
production implementation plus OLA's regression test. The full upstream
`ResponderHelperTester` also passed in a clean Debian build.
