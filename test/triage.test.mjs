import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import triage from '../scripts/triage.cjs'
const url = 'https://github.com/team/project/issues/12'
const sha = 'a'.repeat(40)
function fixture(overrides = {}) {
  const calls = []
  const api = async endpoint => {
    calls.push(endpoint)
    if (Object.hasOwn(overrides, endpoint)) {
      const item = overrides[endpoint]
      if (item instanceof Error) throw item
      return item
    }
    if (endpoint === 'repos/team/project/issues/12') return { title: 'Wrong reply', state: 'open', body: 'Steps: send command; received incorrect reply.' }
    if (endpoint === 'repos/team/project') return { default_branch: 'main', archived: false }
    if (endpoint === 'repos/team/project/commits/main') return { sha, commit: { tree: { sha: 'tree' } } }
    if (endpoint.startsWith('repos/team/project/git/trees/')) return { truncated: false, tree: [{ type: 'blob', path: 'src/main.cpp' }, { type: 'blob', path: 'CMakeLists.txt' }] }
    if (endpoint.includes('/timeline?') || endpoint.includes('/pulls?')) return []
    throw new Error(`Unexpected request ${endpoint}`)
  }
  return { api, calls }
}
test('Healthy source becomes ready for investigation, not qualified or reproduced', async () => {
  const f = fixture(), r = await triage.inspect(url, {}, f.api)
  assert.equal(r.decision, 'READY_TO_INVESTIGATE')
  assert.equal(r.source.commit, sha)
  assert.equal(r.source.buildFiles[0].kind, 'cpp-cmake')
  assert.equal(r.scope.cloned, false)
  assert.equal(r.scope.reproduced, false)
  assert.ok(f.calls.every(c => !c.includes('/archive') && !c.includes('/git/blobs')))
})
test('Swift packages expose source and build evidence', async () => {
  const f = fixture({
    'repos/team/project/git/trees/tree?recursive=1': {
      truncated: false,
      tree: [
        { type: 'blob', path: 'Package.swift' },
        { type: 'blob', path: 'Sources/App/main.swift' },
        { type: 'blob', path: 'Tests/AppTests/AppTests.swift' },
      ],
    },
  })
  const r = await triage.inspect(url, {}, f.api)
  assert.equal(r.decision, 'READY_TO_INVESTIGATE')
  assert.equal(r.source.buildFiles[0].kind, 'swift')
  assert.ok(r.source.codeExamples.includes('Sources/App/main.swift'))
  assert.ok(!r.findings.some(finding => finding.code === 'NO_SOURCE_IDENTIFIED'))
  assert.ok(!r.findings.some(finding => finding.code === 'NO_BUILD_RECIPE'))
})
test('Issue tracker without code needs a source repository, not a claim of closed source', async () => {
  const f = fixture({ 'repos/team/project/git/trees/tree?recursive=1': { tree: [{ type: 'blob', path: 'README.md' }] } })
  const r = await triage.inspect(url, {}, f.api)
  assert.equal(r.decision, 'NEEDS_INFO')
  assert.ok(r.findings.some(f => f.code === 'NO_SOURCE_IDENTIFIED'))
})
test('Explicit source repository and revision are used independently of issue tracker', async () => {
  const f = fixture({ 'repos/team/code': { default_branch: 'main' }, 'repos/team/code/commits/v1': { sha, commit: { tree: { sha: 'other-tree' } } }, 'repos/team/code/git/trees/other-tree?recursive=1': { tree: [{ type: 'blob', path: 'main.c' }, { type: 'blob', path: 'configure.ac' }] } })
  const r = await triage.inspect(url, { source: 'team/code', ref: 'v1' }, f.api)
  assert.equal(r.decision, 'READY_TO_INVESTIGATE')
  assert.equal(r.source.buildFiles[0].kind, 'cpp-autotools')
  assert.ok(f.calls.includes('repos/team/code/commits/v1'))
})
test('Active related PR asks for scope review rather than automatic rejection', async () => {
  const pr = { html_url: 'https://github.com/team/project/pull/5', title: 'Fix #12', body: '', state: 'open', draft: true, user: { login: 'contributor' }, head: { sha } }
  const f = fixture({ 'repos/team/project/pulls?state=open&per_page=100&page=1': [pr], 'repos/team/project/pulls/5': pr })
  const r = await triage.inspect(url, {}, f.api)
  assert.equal(r.decision, 'NEEDS_INFO')
  assert.equal(r.relatedPRs[0].author, 'contributor')
  assert.ok(r.findings.some(f => f.code === 'ACTIVE_RELATED_PR' && f.severity === 'question'))
})
test('Cross-referenced PR from another repository is included', async () => {
  const f = fixture({ 'repos/team/project/issues/12/timeline?per_page=100&page=1': [{ source: { issue: { html_url: 'https://github.com/team/code/pull/3', pull_request: {} } } }], 'repos/team/code/pulls/3': { state: 'closed', merged_at: '2026-09-11', title: 'Possible related fix', user: { login: 'author' } } })
  const r = await triage.inspect(url, {}, f.api)
  assert.equal(r.relatedPRs[0].merged, true)
  assert.equal(r.decision, 'READY_TO_INVESTIGATE')
})
test('PR reference matching does not confuse issue 12 with 123 or another repository', () => {
  const issue = triage.issueURL(url)
  assert.equal(triage.mentions('Fix #123', issue, true), false)
  assert.equal(triage.mentions(url + '3', issue, true), false)
  assert.equal(triage.mentions('Fix #12', issue, false), false)
  assert.equal(triage.mentions('team/project#12', issue, false), true)
})
test('Closed issue and archived source are deferred with reasons', async () => {
  const f = fixture({ 'repos/team/project/issues/12': { state: 'closed', title: 'Resolved', body: 'Done' }, 'repos/team/project': { default_branch: 'main', archived: true } })
  const r = await triage.inspect(url, {}, f.api)
  assert.equal(r.decision, 'DEFER')
  assert.ok(r.findings.some(f => f.code === 'ISSUE_CLOSED'))
  assert.ok(r.findings.some(f => f.code === 'REPOSITORY_INACTIVE'))
})
test('Unavailable source is unknown, not evidence of absence', async () => {
  const f = fixture({ 'repos/team/project': Object.assign(new Error('HTTP 404'), { httpStatus: 404 }) })
  const r = await triage.inspect(url, {}, f.api)
  assert.equal(r.decision, 'NEEDS_INFO')
  assert.equal(r.errors[0].status, 404)
  assert.ok(!r.findings.some(f => f.code === 'NO_SOURCE_IDENTIFIED'))
})
test('Declared unfinished dependency defers work; closed unmerged PR does too', async () => {
  for (const state of ['open', 'closed']) {
    const dep = 'https://github.com/team/dependency/pull/7'
    const f = fixture({ 'repos/team/dependency/pulls/7': { state, merged_at: null } })
    const r = await triage.inspect(url, { dependencies: [dep] }, f.api)
    assert.equal(r.decision, 'DEFER')
    assert.equal(r.dependencies[0].merged, false)
  }
})
test('Git dependency and submodule signals require review without running installers', async () => {
  const f = fixture({ 'repos/team/project/git/trees/tree?recursive=1': { tree: [{ type: 'blob', path: 'src/main.js' }, { type: 'blob', path: 'package.json' }, { type: 'commit', path: 'vendor/device' }] }, [`repos/team/project/contents/package.json?ref=${sha}`]: { size: 100, encoding: 'base64', content: Buffer.from(JSON.stringify({ dependencies: { example: 'github:team/other#work' }, scripts: { test: 'do-not-execute' } })).toString('base64') } })
  const r = await triage.inspect(url, {}, f.api)
  assert.equal(r.decision, 'NEEDS_INFO')
  assert.ok(r.findings.some(f => f.code === 'SUBMODULES'))
  assert.ok(r.findings.some(f => f.code === 'NONREGISTRY_DEPENDENCIES'))
  assert.equal(r.source.nodeDependencyCount, 1)
})
test('package repository metadata is not mistaken for a Git dependency', async () => {
  const pkg = { repository: 'github:team/project', dependencies: { example: '^1.2.3' } }
  const f = fixture({
    'repos/team/project/git/trees/tree?recursive=1': { tree: [{ type: 'blob', path: 'src/main.js' }, { type: 'blob', path: 'package.json' }] },
    [`repos/team/project/contents/package.json?ref=${sha}`]: { size: 100, encoding: 'base64', content: Buffer.from(JSON.stringify(pkg)).toString('base64') },
  })
  const r = await triage.inspect(url, {}, f.api)
  assert.equal(r.decision, 'READY_TO_INVESTIGATE')
  assert.ok(!r.findings.some(f => f.code === 'NONREGISTRY_DEPENDENCIES'))
})
test('reviewed submodule revisions can resolve only the matching triage finding', async () => {
  const f = fixture({ 'repos/team/project/git/trees/tree?recursive=1': { tree: [{ type: 'blob', path: 'src/main.cpp' }, { type: 'blob', path: 'CMakeLists.txt' }, { type: 'commit', path: 'vendor/device' }] } })
  const report = await triage.inspect(url, {}, f.api)
  triage.applyResolutions(report, { resolutions: { SUBMODULES: { reason: 'Pinned submodule checkout completed', evidence: ['git submodule status', 'focused build'] } } })
  assert.equal(report.decision, 'READY_TO_INVESTIGATE')
  assert.equal(report.findings.find(value => value.code === 'SUBMODULES').severity, 'info')
  assert.throws(() => triage.applyResolutions(report, { resolutions: { READ_INCOMPLETE: { reason: 'assumed', evidence: ['none'] } } }), /cannot be resolved/)
})

test('reviewed focused dependency plan can resolve a non-registry dependency', () => {
  const report = {
    findings: [{ code: 'NONREGISTRY_DEPENDENCIES', severity: 'question', detail: 'Review dependency' }],
  }
  triage.applyResolutions(report, {
    resolutions: {
      NONREGISTRY_DEPENDENCIES: {
        reason: 'The focused test uses a separately pinned dependency set and never installs the unrelated Git dependency.',
        evidence: ['audited dependency recipe', 'focused test import graph'],
      },
    },
  })
  assert.equal(report.decision, 'READY_TO_INVESTIGATE')
  assert.equal(report.findings[0].severity, 'info')
})

test('reviewed active PR scope can be resolved with evidence', () => {
  const report = {
    findings: [{ code: 'ACTIVE_RELATED_PR', severity: 'question', detail: 'Review scope' }],
  }
  triage.applyResolutions(report, {
    resolutions: {
      ACTIVE_RELATED_PR: {
        reason: 'The linked PR changes motor geometry while this repair changes capability advertisement.',
        evidence: ['reviewed PR diff', 'candidate file list'],
      },
    },
  })
  assert.equal(report.decision, 'READY_TO_INVESTIGATE')
  assert.equal(report.findings[0].severity, 'info')
})

test('a reviewed executable test command can resolve a missing build manifest', () => {
  const report = {
    findings: [{ code: 'NO_BUILD_RECIPE', severity: 'question', detail: 'No manifest' }],
  }
  triage.applyResolutions(report, {
    resolutions: {
      NO_BUILD_RECIPE: {
        reason: 'The repository is a directly executable Python project.',
        evidence: ['python3 -m unittest discover -s tests completed successfully'],
      },
    },
  })
  assert.equal(report.decision, 'READY_TO_INVESTIGATE')
  assert.equal(report.findings[0].severity, 'info')
})
test('contribution rules are discovered regardless of filename case', async () => {
  const rule = '.github/contributing.md'
  const f = fixture({
    'repos/team/project/git/trees/tree?recursive=1': { tree: [{ type: 'blob', path: 'src/main.cpp' }, { type: 'blob', path: 'CMakeLists.txt' }, { type: 'blob', path: rule }] },
    [`repos/team/project/contents/${rule}?ref=${sha}`]: { size: 80, encoding: 'base64', content: Buffer.from('Pull requests must run the required test suite.').toString('base64') },
  })
  const r = await triage.inspect(url, {}, f.api)
  assert.equal(r.source.ruleFiles[0].path, rule)
  assert.match(r.source.ruleFiles[0].content, /required test/)
})
test('Truncated tree and incomplete PR reads never yield an all-clear', async () => {
  const f = fixture({ 'repos/team/project/git/trees/tree?recursive=1': { truncated: true, tree: [{ type: 'blob', path: 'main.c' }, { type: 'blob', path: 'Makefile' }] }, 'repos/team/project/pulls?state=open&per_page=100&page=1': Object.assign(new Error('HTTP 403'), { httpStatus: 403 }) })
  const r = await triage.inspect(url, {}, f.api)
  assert.equal(r.decision, 'NEEDS_INFO')
  assert.equal(r.coverage.sourceTree, 'limited')
  assert.equal(r.coverage['openPRs:team/project'], 'incomplete')
})
test('Pagination is bounded and recorded rather than claiming exhaustive search', async () => {
  const f = fixture()
  const r = await triage.inspect(url, {}, async endpoint => endpoint.includes('/pulls?') ? Array.from({ length: 100 }, () => ({ body: 'unrelated' })) : f.api(endpoint))
  assert.equal(r.decision, 'NEEDS_INFO')
  assert.equal(r.coverage['openPRs:team/project'], 'limited')
})
test('CLI report saves decision and provenance without a source checkout', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-triage-test-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const f = fixture(), out = await triage.run(root, url, [], f.api)
  assert.equal(out.decision, 'READY_TO_INVESTIGATE')
  assert.equal(JSON.parse(fs.readFileSync(out.data)).source.commit, sha)
  assert.match(fs.readFileSync(out.report, 'utf8'), /No clone, build/)
  assert.equal(fs.existsSync(path.join(root, 'sources')), false)
})
test('Reject malformed URLs, refs, options and a PR masquerading as an issue', async () => {
  assert.throws(() => triage.issueURL('https://github.com/a/b/pull/1'))
  assert.throws(() => triage.options(['--source', '../../other']))
  assert.throws(() => triage.options(['--ref', '../main']))
  assert.throws(() => triage.options(['--dependency', 'https://example.com/code']))
  const f = fixture({ 'repos/team/project/issues/12': { pull_request: {} } })
  await assert.rejects(triage.inspect(url, {}, f.api), /identifies a PR/)
})
