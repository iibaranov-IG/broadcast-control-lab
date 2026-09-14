from importlib.metadata import version
from pathlib import Path
import sysconfig


directory = Path(sysconfig.get_paths()["purelib"]) / "blueye_sdk-2.7.0.dist-info"
directory.mkdir(exist_ok=True)
(directory / "METADATA").write_text(
    "Metadata-Version: 2.1\nName: blueye.sdk\nVersion: 2.7.0\n",
    encoding="utf-8",
)
assert version("blueye.sdk") == "2.7.0"
