import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
const source = path.resolve(process.argv[2] || 'sources/sendspin-54')
const directory = mkdtempSync(path.join(tmpdir(), 'bcl-sendspin-54-'))
const binary = path.join(directory, 'gap')
const result = { issue: 'https://github.com/Sendspin/sendspin-cpp-cli/issues/54', revision: 'c33c0e09ec4fea2a758abfbd9bd36af61dc4faa8', hardwareVerified: false, results: [] }
try {
  const compile = execFileSync('c++', ['-std=c++20', '-Wall', '-Wextra', '-Werror', '-I', path.join(source, 'src'), 'cases/sendspin-54/probe.cpp', path.join(source, 'src/sink_recovery.cpp'), '-o', binary], { encoding: 'utf8' })
  const output = execFileSync(binary, { encoding: 'utf8' })
  result.results.push({ name: 'discarded ALSA playback gap accounting', status: 'PASS', output: compile + output })
} catch (error) {
  result.results.push({ name: 'discarded ALSA playback gap accounting', status: 'FAIL', output: String(error.stdout || '') + String(error.stderr || error.message) })
}
mkdirSync('reports', { recursive: true })
writeFileSync('reports/sendspin-54.json', JSON.stringify(result, null, 2) + '\n')
for (const item of result.results) console.log(`${item.status}: ${item.name}`)
if (result.results.some(item => item.status === 'FAIL')) process.exitCode = 1
