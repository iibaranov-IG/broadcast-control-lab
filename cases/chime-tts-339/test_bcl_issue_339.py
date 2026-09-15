"""Source contract for the external-chime double-resolution regression."""

from pathlib import Path
import sys
import unittest


ROOT = Path(sys.argv.pop(1)) if len(sys.argv) > 1 else Path.cwd()
SOURCE = (ROOT / "custom_components/chime_tts/__init__.py").read_text()
START = SOURCE.index("async def async_get_audio_from_path(")
END = SOURCE.index("\n##################", START)
FUNCTION = SOURCE[START:END]


class ExternalChimeResolutionTests(unittest.TestCase):
    def test_download_descriptor_is_an_accepted_input(self):
        self.assertIn(
            "filepath: str | dict",
            FUNCTION,
            "pre-resolved external chimes must remain valid playback inputs",
        )

    def test_download_descriptor_bypasses_second_resolution(self):
        guard = FUNCTION.find("if not isinstance(filepath, dict):")
        resolver = FUNCTION.find("filesystem_helper.async_get_chime_path(")
        self.assertGreaterEqual(
            guard,
            0,
            "pre-resolved descriptor must bypass second resolution",
        )
        self.assertGreater(
            resolver,
            guard,
            "the resolver must be inside the non-descriptor guard",
        )

    def test_descriptor_still_loads_its_local_audio(self):
        descriptor = FUNCTION.find("if isinstance(filepath, dict):")
        local_path = FUNCTION.find("audio_dict.get(LOCAL_PATH_KEY, None)", descriptor)
        loader = FUNCTION.find("filesystem_helper.async_load_audio(filepath)", local_path)
        self.assertGreaterEqual(descriptor, 0)
        self.assertGreater(local_path, descriptor)
        self.assertGreater(loader, local_path)


if __name__ == "__main__":
    unittest.main()
