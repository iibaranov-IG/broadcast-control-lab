#!/usr/bin/env python3
import pathlib, re, sys
root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.')
header = (root / 'src/volume.h').read_text()
implementation = (root / 'src/volume.cpp').read_text()
helper = (root / 'src/helper.h').read_text()
checks = {
    'Volume declaration accepts the raw 12-bit integer type': bool(re.search(r'SetFadervalue\s*\(\s*uint16_t\s+volume\s*\)', header)),
    'Volume implementation preserves the integer type': bool(re.search(r'Volume::SetFadervalue\s*\(\s*uint16_t\s+vol\s*\)', implementation)),
    'Volume and Helper expose the same input type': bool(re.search(r'Fadervalue2dBfs\s*\(\s*uint16_t\s+faderValue\s*\)', helper)),
    'The misleading float overload is absent': not bool(re.search(r'SetFadervalue\s*\(\s*float\b', header + implementation)),
}
for name, ok in checks.items():
    print(('PASS' if ok else 'FAIL') + ': ' + name)
print(f'Ran {len(checks)} tests')
if not all(checks.values()):
    print('BUG_FADER_TYPE_MISMATCH')
    raise SystemExit(1)
print('PASS: raw fader type contract is consistent')
