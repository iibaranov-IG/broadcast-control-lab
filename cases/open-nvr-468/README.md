# OpenNVR #468

A TP-Link Tapo C520WS rejects HTTP Digest at the SOAP layer instead of issuing a
Digest challenge. The shared ONVIF request primitive therefore returned the
fault and camera addition, profile discovery, stream URI lookup and PTZ failed.

The repair keeps Digest first and retries exactly once with WS-Security
UsernameToken PasswordDigest only when an authenticated non-success SOAP Fault
contains `NotAuthorized` or `Authority failure`. The regression verifies the
nonce/time/password digest and proves that success, unrelated failure and
anonymous calls do not retry.
