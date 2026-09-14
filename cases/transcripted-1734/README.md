# Transcripted asynchronous USB microphone binding repair

Issue: https://github.com/r3dbars/transcripted/issues/1734

Transcripted selected a Logitech C920 correctly, but treated `setDeviceID` as synchronous. Some USB drivers accept the command and publish the new AUHAL device ID later. The immediate read therefore rejected a valid route before the application's existing 300 ms settle phase and eventually surfaced as `Selected mic unavailable`.

The candidate validates the requested ID, preserves native setter errors, and lets a successful route command reach the existing delayed verification. A route that is still stale after settling remains rejected.

BCL compiles the real policy and its focused upstream test. The pinned baseline fails the deterministic C920 sequence; the candidate passes. Physical capture on the reporter's C920 and a complete build on macOS 26 with full Xcode remain owner-operated.
