import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluate, gates, weights, blocked } from '../scripts/selection-policy.cjs'
const report = () => ({ issue: { url: 'https://github.com/team/project/issues/1', repository: 'team/project' }, source: { repository: 'team/project', commit: 'a'.repeat(40) }, relatedPRs: [], decision: 'READY_TO_INVESTIGATE' })
function assessment() {
  return { issue: report().issue.url, sourceCommit: 'a'.repeat(40), gates: Object.fromEntries(gates.map(k => [k, { status: 'PASS', reason: 'Reviewed', evidence: ['owner confirmation'] }])), dimensions: Object.fromEntries(Object.keys(weights).map(k => [k, { value: 5, reason: 'Reviewed', evidence: ['issue log'] }])), delivery: { ownerContact: 5, acceptancePath: 5, validationAccess: 5, reason: 'Confirmed by owner', evidence: ['owner reply'] } }
}
test('unknown evidence never invents scores or a delivery probability', () => {
  const r = evaluate(report())
  assert.equal(r.score, null); assert.equal(r.deliveryProbability, null); assert.equal(r.eligible, false)
  assert.deepEqual(r.scoreRange, [0, 100])
})
test('complete bound assessment uses requested thresholds and delivery-first key', () => {
  const r = evaluate(report(), assessment())
  assert.equal(r.class, 'TAKE_NOW'); assert.deepEqual(r.queueKey, [100, 100])
  const a = assessment(); for (const v of Object.values(a.dimensions)) v.value = 3
  assert.equal(evaluate(report(), a).class, 'RESERVE')
  a.sourceCommit = 'b'.repeat(40); assert.throws(() => evaluate(report(), a), /stale/)
})
test('denylist, active PR, missing license and explicit exclusion override high scores', () => {
  assert.equal(blocked('BitFocus/companion'), true); assert.equal(blocked('another/bitfocus-tool'), false)
  for (const change of [r => { r.source.repository = 'bitfocus/project' }, r => { r.relatedPRs.push({ state: 'open' }) }, r => { r.source.licenseMissing = true }]) {
    const r = report(); change(r); assert.equal(evaluate(r, assessment()).class, 'REJECT')
  }
  const a = assessment(); a.gates.nonSecurity.status = 'REJECT'
  assert.equal(evaluate(report(), a).class, 'REJECT')
})
