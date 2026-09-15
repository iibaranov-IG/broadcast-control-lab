# Ignore attached artwork when classifying audio uploads

Issue: https://github.com/SUNET/scribe-worker/issues/49

The regression fixture generates an ordinary MP3, the same MP3 with a PNG `attached_pic`, and a real MP4. The pinned source mistakes the cover for video and sends the MP3 through the video path. The repair excludes attached pictures during classification and makes both audio conversions select only the first audio stream.

Automated evidence covers stream classification plus WAV and audio-preview output. The reporter should repeat the upload with the original Pro Tools export in the deployed service.
