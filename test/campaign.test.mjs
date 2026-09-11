import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { issues, options, run } from '../scripts/campaign.cjs'

test('campaign input is canonical, distinct and bounded to one hundred issues', () => {
  assert.deepEqual(issues('# queue\nhttps://github.com/team/project/issues/1/\n'), ['https://github.com/team/project/issues/1'])
  assert.throws(() => issues('https://github.com/team/project/issues/1\nhttps://github.com/TEAM/project/issues/1'), /distinct/)
  assert.throws(() => issues(Array.from({ length: 101 }, (_, index) => `https://github.com/team/project/issues/${index + 1}`).join('\n')), /limit/)
  assert.deepEqual(options(['--concurrency', '8', '--limit', '100', '--retry-failed']), { concurrency: 8, limit: 100, retryFailed: true })
})

test('campaign checkpoints each result and resumes only interrupted or failed work', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-campaign-test-'))
  const input = path.join(root, 'issues.txt')
  fs.writeFileSync(input, ['https://github.com/team/project/issues/1', 'https://github.com/team/project/issues/2'].join('\n'))
  const calls = []
  const triage = async (_root, issue) => {
    calls.push(issue)
    if (issue.endsWith('/2') && calls.filter(value => value === issue).length === 1) throw new Error('temporary read failure')
    const directory = path.join(root, issue.endsWith('/1') ? 'one' : 'two'); fs.mkdirSync(directory, { recursive: true })
    const data = path.join(directory, 'triage.json'); fs.writeFileSync(data, JSON.stringify({ errors: [] }))
    return { decision: 'READY_TO_INVESTIGATE', report: path.join(directory, 'TRIAGE.md'), data }
  }
  const first = await run(root, 'repair-100', { file: input, concurrency: 2, limit: 100, retryFailed: false }, triage)
  assert.equal(first.status, 'COMPLETE_WITH_FAILURES')
  assert.deepEqual(first.counts, { READY_TO_INVESTIGATE: 1, FAILED: 1 })
  const second = await run(root, 'repair-100', { concurrency: 2, limit: 100, retryFailed: true }, triage)
  assert.equal(second.status, 'COMPLETE')
  assert.deepEqual(second.counts, { READY_TO_INVESTIGATE: 2 })
  assert.equal(calls.filter(value => value.endsWith('/1')).length, 1)
  assert.equal(calls.filter(value => value.endsWith('/2')).length, 2)
  const checkpoint = JSON.parse(fs.readFileSync(path.join(root, 'reports/campaigns/repair-100/state.json')))
  assert.deepEqual(checkpoint.items.map(item => item.attempts), [1, 2])
})
