"""Isolate unchanged backend files from the verified checkout; no downloads."""
from pathlib import Path
import shutil

source = Path('sources/autoptz')
for name in ('base.py', 'reconnect.py', 'visca_ip.py'):
    relative = Path('autoptz/engine/ptz') / name
    target = source / '.bcl-isolated' / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source / relative, target)
