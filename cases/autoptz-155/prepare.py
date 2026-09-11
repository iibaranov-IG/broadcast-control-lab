"""Fetch the exact backend and its two stdlib-only dependencies for isolation."""
from pathlib import Path
from urllib.request import urlopen

revision = '39d8ebab461d86e8e06a683905829d21acec7adc'
for name in ('base.py', 'reconnect.py', 'visca_ip.py'):
    relative = 'autoptz/engine/ptz/' + name
    target = Path('sources/autoptz') / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    with urlopen(f'https://raw.githubusercontent.com/iibaranov-IG/autoptz/{revision}/{relative}', timeout=30) as response:
        target.write_bytes(response.read())
