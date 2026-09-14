import os
import subprocess
import sys

environment = dict(os.environ)
environment['PYTHONPATH'] = 'src'
result = subprocess.run(
    [sys.executable, '-m', 'pytest', 'tests/test_dmx.py::test_export_bin_stub_roundtrip', '-q'],
    env=environment,
)
if result.returncode:
    raise SystemExit(result.returncode)
print('Ran 1 test')
