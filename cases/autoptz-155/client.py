import json
import sys

sys.path.insert(0, sys.argv[1])
from autoptz.engine.ptz.visca_ip import ViscaIPBackend

backend = ViscaIPBackend('127.0.0.1', int(sys.argv[2]), mode=sys.argv[3], transport='udp', timeout=0.3)
try:
    if sys.argv[4] == 'stop':
        backend.stop()
        result = 'sent'
    else:
        response = backend._query(bytes.fromhex('81090447ff'), 7)
        result = response.hex() if response is not None else None
    print(json.dumps({'result': result, 'connected': backend.connected}))
finally:
    backend._close_sock()
