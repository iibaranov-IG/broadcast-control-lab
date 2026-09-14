import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import integration from '../scripts/integration.cjs'
const temp = t => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-integration-')); t.after(() => fs.rmSync(d, { recursive: true, force: true })); return d }
test('metadata inventory keeps unresolved expressions and never runs Make', t => {
 const d = temp(t)
 fs.writeFileSync(path.join(d, 'x.mk'), 'X_VERSION = abc123\nX_SITE = https://example.org/x\nY_VERSION = $(shell touch SHOULD_NOT_EXIST)\n')
 fs.writeFileSync(path.join(d, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages: { '': {}, 'node_modules/a': { version: '1.2.3', integrity: 'sha512-example' } } }))
 fs.symlinkSync('/tmp', path.join(d, 'ignored'))
 const result = integration.scan(d)
 assert.equal(result.pins.length, 2); assert.equal(result.unresolved.length, 1)
 assert.equal(fs.existsSync(path.join(d, 'SHOULD_NOT_EXIST')), false)
 assert.equal(result.pins.find(x => x.kind === 'npm').integrity, 'sha512-example')
})
test('integration readiness requires a fix in the candidate and forward ancestry', t => {
 const d = temp(t), git = (...args) => execFileSync('git', ['-C', d, ...args], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim()
 git('init'); git('config', 'user.email', 'test@example.org'); git('config', 'user.name', 'BCL test')
 const commit = value => { fs.writeFileSync(path.join(d, 'file'), value); git('add', 'file'); git('commit', '-m', value); return git('rev-parse', 'HEAD') }
 const baseline = commit('baseline'), fix = commit('fix'), candidate = commit('candidate')
 const input = { schemaVersion: 1, repository: d, productPin: baseline, fixCommit: fix, candidateCommit: candidate }
 assert.equal(integration.assess(input).status, 'READY_TO_INTEGRATE')
 assert.equal(integration.assess({ ...input, productPin: candidate }).status, 'ALREADY_INTEGRATED')
 assert.equal(integration.assess({ ...input, candidateCommit: baseline }).status, 'NEEDS_REVIEW')
 assert.throws(() => integration.assess({ ...input, fixCommit: 'HEAD' }), /full commit/)
 fs.writeFileSync(path.join(d, '.git', 'shallow'), baseline + '\n')
 assert.throws(() => integration.assess(input), /Complete history/)
})
