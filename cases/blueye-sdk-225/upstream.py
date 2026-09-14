import re
import subprocess
import sys


mode = sys.argv[1]
if mode == "focused":
    args = [
        "-m",
        "pytest",
        "tests/test_sdk.py::test_gp_cam_recording",
        "tests/test_sdk.py::test_main_cam_recording_preserves_multibeam_state",
        "tests/test_ctrl_client.py",
    ]
elif mode == "suite":
    args = ["-m", "pytest", "-k", "not connected_to_drone"]
else:
    raise SystemExit("use focused or suite")

result = subprocess.run([sys.executable, *args], text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
print(result.stdout, end="")
if mode == "suite" and result.returncode == 0:
    match = re.search(r"(\d+) passed", result.stdout)
    if not match:
        raise SystemExit("pytest completion count missing")
    print(f"Ran {match.group(1)} tests")
    print("BCL_SUITE_COMPLETE")
raise SystemExit(result.returncode)
