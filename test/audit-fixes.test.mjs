import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { suiteSummary, validate } from '../scripts/upstream.cjs'
import { context } from '../scripts/batch.cjs'
import { check, load, hash } from '../scripts/selection-gate.cjs'
import { evaluate, weights, gates } from '../scripts/selection-policy.cjs'
import { validateBatchManifest } from '../scripts/publish.cjs'
test('CTest entirely skipped output fails; partially skipped output counts actual skips', () => {
  assert.throws(() => suiteSummary('cpp-cmake', '100% tests passed, 0 tests failed out of 1\nThe following tests did not run:\n  1 - audio (Skipped)\n'), /nonempty/)
  assert.deepEqual(suiteSummary('cpp-cmake', '100% tests passed, 0 tests failed out of 2\nThe following tests did not run:\n  2 - audio (Skipped)\n').skipped, 1)
  assert.throws(() => suiteSummary('cpp-cmake', '100% tests passed, 0 tests failed out of 1\nThe following tests did not run:\nchanged output'), /Unrecognized/)
})
test('low-scoring and reserve candidates cannot enter execution queue', () => {
  const r = { issue: { url: 'https://github.com/a/b/issues/1', repository: 'a/b' }, source: { repository: 'a/b', commit: 'a'.repeat(40) }, relatedPRs: [], decision: 'READY_TO_INVESTIGATE' }
  for (const value of [1, 3]) {
    const a = { issue: r.issue.url, sourceCommit: r.source.commit, gates: Object.fromEntries(gates.map(k => [k, { status: 'PASS', reason: 'fixture', evidence: ['fixture'] }])), dimensions: Object.fromEntries(Object.keys(weights).map(k => [k, { value, reason: 'fixture', evidence: ['fixture'] }])), delivery: { ownerContact: 5, acceptancePath: 5, validationAccess: 5, reason: 'fixture', evidence: ['fixture'] } }
    const scored = evaluate(r, a); assert.equal(scored.eligible, false); assert.equal(scored.queueKey, null)
    assert.equal(scored.class, value === 1 ? 'SKIP' : 'RESERVE')
  }
})
test('failed shared acquisition leaves no partial checkout and later case retries cleanly', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-cache-audit-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const cache = context(root), source = { repository: 'a/b', commit: 'a'.repeat(40) }
  assert.throws(() => cache.source(source, path.join(root, 'first'), dir => { fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, 'partial'), 'x'); throw new Error('download failed') }), /download failed/)
  assert.equal(fs.readdirSync(root).length, 0)
  cache.source(source, path.join(root, 'second'), dir => { assert.equal(fs.existsSync(dir), false); fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, 'source'), 'complete') })
  assert.equal(fs.readFileSync(path.join(root, 'second/source'), 'utf8'), 'complete')
})
function selected() {
  const c = { issue: 'https://github.com/a/b/issues/1', sources: [{ id: 'upstream', repository: 'a/b', commit: 'a'.repeat(40) }], upstream: { source: 'upstream' }, publish: { source: 'upstream', target: 'a/b' } }
  const report = { checkedAt: new Date().toISOString(), issue: { url: c.issue }, source: { repository: 'a/b', commit: 'a'.repeat(40) }, decision: 'READY_TO_INVESTIGATE', ranking: { eligible: true, assessmentBoundToRevision: true, score: 90, exclusions: [], unknownGates: [] } }
  return { c, report }
}
test('selection gate rejects missing approval, stale publication and wrong source', () => {
  const {c, report} = selected()
  assert.throws(() => load('/tmp', c), /requires/)
  check(report, c)
  assert.throws(() => check({...report,decision:'REJECT'},c), /approved/)
  assert.throws(() => check({...report,checkedAt:'2020-01-01'},c,{publishing:true}), /Refresh/)
  assert.throws(() => check({...report,source:{...report.source,commit:'b'.repeat(40)}},c), /match/)
})
test('selection file is hash-bound; existing-PR validation cannot authorize publication', t => {
  const {c,report}=selected(), root=fs.mkdtempSync(path.join(os.tmpdir(),'bcl-selection-audit-')); t.after(()=>fs.rmSync(root,{recursive:true,force:true}))
  const bytes=JSON.stringify(report); fs.writeFileSync(path.join(root,'triage.json'),bytes); c.selection={report:'triage.json',sha256:hash(bytes)}
  load(root,c); fs.appendFileSync(path.join(root,'triage.json'),' '); assert.throws(()=>load(root,c),/hash/)
  c.selection={purpose:'EXISTING_PR_VALIDATION',existingPR:'https://github.com/a/b/pull/2',reason:'Revalidate existing work'}
  const existing={...report,decision:'REJECT',relatedPRs:[{url:c.selection.existingPR}],errors:[]}
  check(existing,c); assert.throws(()=>check(existing,c,{publishing:true}),/cannot authorize/)
})
test('mismatched upstream and publication source fails validation', () => {
  assert.throws(()=>validate({sources:[{id:'one'},{id:'two'}],publish:{source:'two'},upstream:{kind:'node',source:'one'}},()=>{}),/same source/)
})
test('completed mixed batch permits only its individually passing case', () => {
  const m={completed:true,status:'FAIL',cases:[{case:'good',status:'PASS'},{case:'bad',status:'FAIL'}]}
  validateBatchManifest(m,'good')
  assert.throws(()=>validateBatchManifest(m,'bad'),/did not pass/)
  assert.throws(()=>validateBatchManifest({...m,completed:false},'good'),/did not pass/)
  assert.throws(()=>validateBatchManifest({...m,cases:[...m.cases,m.cases[0]]},'good'),/did not pass/)
})
