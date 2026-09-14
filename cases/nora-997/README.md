# Nora raw APK Content-Type

The pinned baseline sends `.apk` downloads as `application/octet-stream` because the raw registry extension map has no APK entry. The unchanged BCL test proves that failure before the candidate is applied.

The candidate uses Android's registered `application/vnd.android.package-archive` MIME type, adds the project's required Rust regression coverage and changelog fragment, and leaves `.aab` on the existing unknown-file fallback.
