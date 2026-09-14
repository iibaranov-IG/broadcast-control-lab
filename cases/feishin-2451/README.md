# Feishin #2451

This case preserves the direct-play fallback for an OpenSubsonic server whose CORS policy blocks the optional JSON transcode-decision request.

The baseline check applies only the verification test and must fail because the rejected request escapes. The candidate then applies `repair.patch`; the same check must pass because the request failure is logged and returns the existing direct stream URL.

The public repair contains only the production controller change. The Node test is BCL verification material and is excluded from publication.
