# majestic-webui #477

The firmware upgrade socket carries its transcript in binary frames but sends
refusals and final failure explanations as text frames. The page converted every
payload to `Uint8Array`; a JavaScript string therefore became an empty array and
the camera's diagnostic disappeared.

The repair branches on the WebSocket payload type. A focused VM-browser test
proves that a text refusal reaches the terminal unchanged while the existing
binary transcript assertion continues to pass.
