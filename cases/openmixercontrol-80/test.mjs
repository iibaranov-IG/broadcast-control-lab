import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
const source = path.resolve(process.argv[2] || 'sources/openmixercontrol-80')
const result = { issue: 'https://github.com/OpenMixerProject/OpenMixerControl/issues/80', revision: '6838286c6fb2eefc16a71aaacf091f4dda40a629', hardwareVerified: false, results: [] }
try {
  const output = execFileSync('python3', ['cases/openmixercontrol-80/probe.py', source], { encoding: 'utf8' })
  result.results.push({ name: 'raw fader type contract', status: 'PASS', output })
} catch (error) {
  result.results.push({ name: 'raw fader type contract', status: 'FAIL', output: String(error.stdout || error.message) })
}
mkdirSync('reports', { recursive: true })
writeFileSync('reports/openmixercontrol-80.json', JSON.stringify(result, null, 2) + '\n')
for (const item of result.results) console.log(`${item.status}: ${item.name}`)
if (result.results.some(item => item.status === 'FAIL')) process.exitCode = 1
