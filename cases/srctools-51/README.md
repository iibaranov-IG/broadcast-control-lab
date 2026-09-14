# srctools #51

Binary DMX marks a reference to an external element with index `-2`, followed by
that element's null-terminated UUID. The writer emitted only the marker, so its
own parser reached end-of-file while reading the missing UUID.

The repair writes the UUID immediately after the marker. A focused in-memory
round trip fails on the pinned baseline and passes afterward, preserving the
format name, version, stub identity and exact UUID.
