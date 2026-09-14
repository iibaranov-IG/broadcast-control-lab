# Reproduction

The unchanged contract test must fail on the pinned baseline with `APK_MIME_MISSING`.

# Repair

The candidate adds the APK MIME match arm and production Rust regression assertions. The BCL contract must pass both the APK mapping and AAB fallback checks.

# Owner checks

Upload and download an APK from an Android browser, then confirm the response MIME and installer handoff.
