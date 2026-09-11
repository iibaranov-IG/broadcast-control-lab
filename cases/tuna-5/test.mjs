import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

const source = path.resolve(process.argv[2] || 'sources/tuna-5')
const report = {
  issue: 'https://github.com/x42/tuna.lv2/issues/5',
  revision: 'd6d2341e4a0b5eb71b12943e8692e14dcf0645b1',
  evidence: 'Generated LV2 doap:name values and checked-in runtime descriptor consistency',
  hardwareVerified: false,
  results: [],
}
const record = (name, fn) => {
  const started = performance.now()
  try { fn(); report.results.push({ name, status: 'PASS', durationMs: Math.round(performance.now() - started) }) }
  catch (error) { report.results.push({ name, status: 'FAIL', durationMs: Math.round(performance.now() - started), message: error.message }) }
}

record('all generated LV2 names contain Tuna and preserve both variants', () => {
  const project = readFileSync(path.join(source, 'lv2ttl/tuna.ttl.in'), 'utf8').replaceAll('@LV2NAME@', 'tuna')
  const instance = readFileSync(path.join(source, 'lv2ttl/tuna.lv2.ttl.in'), 'utf8')
  const normal = instance.replaceAll('@NAME_SUFFIX@', '').replaceAll('@INSTANCE@', 'one')
  const spectrum = instance.replaceAll('@NAME_SUFFIX@', '[Spectrum]').replaceAll('@INSTANCE@', 'two')
  const names = [project, normal, spectrum].map(text => {
    const match = text.match(/doap:name\s+"([^"]+)"/)
    if (!match) throw new Error('missing doap:name')
    return match[1]
  })
  if (names.some(name => !name.includes('Tuna'))) throw new Error(`Tuna missing from ${names.join(', ')}`)
  if (names[1] !== 'x42 Tuna Instrument Tuner') throw new Error(`unexpected normal name: ${names[1]}`)
  if (names[2] !== 'x42 Tuna Instrument Tuner[Spectrum]') throw new Error(`unexpected spectrum name: ${names[2]}`)
})

record('compiled descriptor headers match the LV2 instance names', () => {
  const one = readFileSync(path.join(source, 'lv2ttl/tuna1.h'), 'utf8')
  const two = readFileSync(path.join(source, 'lv2ttl/tuna2.h'), 'utf8')
  if (!one.includes('"x42 Tuna Instrument Tuner" // const char *plugin_human_id')) throw new Error('normal descriptor name is stale')
  if (!two.includes('"x42 Tuna Instrument Tuner[Spectrum]" // const char *plugin_human_id')) throw new Error('spectrum descriptor name is stale')
})

mkdirSync('reports', { recursive: true })
writeFileSync('reports/tuna-5.json', JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}${result.message ? ': ' + result.message : ''}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
