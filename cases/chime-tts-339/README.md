# External URL chime playback

Case for https://github.com/nimroddolev/chime_tts/issues/339.

The playback builder resolves a URL before creating its cache key, producing a
download descriptor. The audio loader used to send that descriptor through the
string-only resolver again, which discarded it. This case proves the baseline
failure and that the candidate loads the descriptor's local MP3 directly.
