import subprocess
import sys

result = subprocess.run(
    [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-v'],
    text=True,
    capture_output=True,
)
sys.stdout.write(result.stdout)
sys.stderr.write(result.stderr)
if result.returncode:
    print('BUG_PTZ_HELPER_HANGS_STARTUP')
    raise SystemExit(1)
print('Ran 2 tests')
