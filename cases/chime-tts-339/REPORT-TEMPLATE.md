# Reproduction

At the pinned revision, `async_get_playback_audio_path` resolves the URL to a
download descriptor. `async_get_audio_from_path` resolves that value again using
the string-only filesystem helper, so no local audio file or Media Content ID is
produced.

# Repair

Accept pre-resolved download descriptors in the audio loader and resolve only
string paths. The upstream regression test exercises the descriptor directly.

# Owner checks

Repeat the issue YAML against the same external MP3 and Google Audio target.
