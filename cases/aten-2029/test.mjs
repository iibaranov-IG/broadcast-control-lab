import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { getActions as upstream } from './upstream.mjs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
const { getActions: candidate } = await import(process.argv[2] ? pathToFileURL(resolve(process.argv[2])).href : './candidate.mjs')

const report = { issue: 'https://github.com/bitfocus/companion-module-requests/issues/2029', evidence: 'action-contract-test', hardwareVerified: false, results: [] }
function instance() {
  return {
    config: { device: 16 }, sent: [],
    sendCmd(command) { this.sent.push(command) },
    async parseVariablesInString(value) {
      return value.replace('$(custom:source)', '3').replace('$(custom:destination)', '12')
    },
  }
}
async function run(factory, src, dst) {
  const self = instance()
  await factory(self).SS.callback({ options: { src, dst } })
  return self.sent
}
async function check(name, callback) {
  try { await callback(); report.results.push({ name, status: 'PASS' }) }
  catch (error) { report.results.push({ name, status: 'FAIL', message: error.message }) }
}
await check('Baseline cannot offer variable-enabled crosspoint fields', () => {
  const fields = upstream(instance()).SS.options
  assert.ok(fields.every(field => field.type === 'number' && !field.useVariables))
})
await check('Baseline negative control: expressions do not produce expected command', async () => {
  const sent = await run(upstream, '$(custom:source)', '$(custom:destination)')
  assert.notDeepEqual(sent, ['SS 03,12'])
  report.baselineObservedCommand = sent[0]
})
await check('Candidate exposes variable-enabled text fields', () => {
  assert.ok(candidate(instance()).SS.options.every(field => field.type === 'textinput' && field.useVariables))
})
await check('Candidate expands both variables before sending one command', async () => {
  assert.deepEqual(await run(candidate, '$(custom:source)', '$(custom:destination)'), ['SS 03,12'])
})
await check('Candidate preserves saved numeric options', async () => {
  assert.deepEqual(await run(candidate, 1, 16), ['SS 01,16'])
})
await check('Candidate preserves profile action', async () => {
  const self = instance()
  await candidate(self).LO.callback({ options: { num: 3 } })
  assert.deepEqual(self.sent, ['LO 03'])
})
await check('Candidate rejects invalid values without sending', async () => {
  for (const value of ['0', '17', '1.5', '', '$(custom:unknown)', 'abc']) {
    for (const options of [{ src: value, dst: 1 }, { src: 1, dst: value }]) {
      const self = instance()
      await assert.rejects(() => candidate(self).SS.callback({ options }))
      assert.deepEqual(self.sent, [])
    }
  }
})
mkdirSync(new URL('../../reports/', import.meta.url), { recursive: true })
writeFileSync(new URL('../../reports/aten-2029.json', import.meta.url), JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
