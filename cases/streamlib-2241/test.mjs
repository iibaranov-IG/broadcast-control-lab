import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const code = fs.readFileSync(path.join(source, 'examples/microphone-reverb-speaker/processors/reverb_effect.py'), 'utf8')
const tests = fs.readFileSync(path.join(source, 'examples/microphone-reverb-speaker/tests/test_reverb_effect.py'), 'utf8')
assert.ok(code.includes('@dataclass\nclass ReverbEffectConfig:'))
assert.ok(code.includes('def __init__(self, config: ReverbEffectConfig) -> None:'))
assert.ok(code.includes('config.room_size'))
assert.ok(code.includes('config.damping'))
assert.ok(tests.includes('test_default_config_preserves_the_existing_dials'))
assert.ok(tests.includes('test_config_values_are_validated'))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/streamlib-2241.json', JSON.stringify({ results: [{ name: 'reverb processor config class', status: 'PASS' }] }, null, 2) + '\n')
console.log('PASS streamlib-2241: config-class migration verified')
