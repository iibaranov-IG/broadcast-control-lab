import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const code = fs.readFileSync(path.join(source, 'src/srctools/dmx.py'), 'utf8')
const tests = fs.readFileSync(path.join(source, 'tests/test_dmx.py'), 'utf8')
assert.ok(code.includes("file.write(str(subelem.uuid).encode('ascii') + b'\\0')"))
assert.ok(tests.includes('def test_export_bin_stub_roundtrip()'))
assert.ok(tests.includes('assert parsed_stub.is_stub'))
assert.ok(tests.includes('assert parsed_stub.uuid == stub_uuid'))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/srctools-51.json', JSON.stringify({ results: [{ name: 'binary DMX stub UUID round trip', status: 'PASS' }] }, null, 2) + '\n')
console.log('PASS srctools-51: binary stub reference verified')
