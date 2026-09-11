#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { execFileSync } = require('node:child_process')
const { load, validate, all, root } = require('./case.cjs')
const { writeEvidence } = require('./evidence.cjs')
function exec(program, args, options = {}) { return execFileSync(program, args, { cwd: root, stdio: 'inherit', ...options }) }
function scaffold(url, sourceCommit, title) {
  const match = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/issues\/(\d+)\/?$/.exec(url)
  if (!match || !/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error('Use a GitHub issue URL and resolved source commit')
  const [, owner, repo, issue] = match
  const id = `${repo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${issue}`
  return validate({ schemaVersion: 2, id, status: 'draft', title, issue: url,
    problem: title, reproduce: 'TODO: describe the failing behavior and input.',
    acceptance: 'TODO: define an observable success condition.', repair: 'TODO: implement and explain the repair.',
    sources: [{ id: 'baseline', repository: `${owner}/${repo}`, commit: sourceCommit, directory: `sources/${id}` }],
    runtime: { node: '22.20.0', python: '3.12.14' }, watch: [],
    steps: { dependencies: [], prepare: [], test: [{ cwd: '.', argv: ['node', `cases/${id}/test.mjs`] }], build: [] },
    artifacts: { report: `reports/${id}.json` },
    verification: { hardwareVerified: false, applicationVerified: false,
      limitations: 'Draft scaffold: no bug has been reproduced or repaired.', ownerCheck: 'TODO: specify the owner-operated hardware check.' } })
}
async function create(url) {
  const m = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/issues\/(\d+)\/?$/.exec(url || '')
  if (!m) throw new Error('Usage: bcl new https://github.com/owner/repo/issues/123')
  async function api(p) {
    const response = await fetch(`https://api.github.com/repos/${m[1]}/${m[2]}/${p}`, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`GitHub read failed: ${response.status}`)
    return response.json()
  }
  const issue = await api(`issues/${m[3]}`)
  if (issue.pull_request) throw new Error('Use an issue URL, not a pull request')
  const commits = await api('commits?per_page=1')
  const c = scaffold(url, commits[0].sha, issue.title)
  const directory = path.join(root, 'cases', c.id)
  if (fs.existsSync(directory)) throw new Error('Case already exists; nothing overwritten')
  fs.mkdirSync(directory)
  fs.writeFileSync(path.join(directory, 'case.json'), JSON.stringify(c, null, 2) + '\n')
  fs.writeFileSync(path.join(directory, 'test.mjs'), `import { mkdirSync, writeFileSync } from 'node:fs'\nconst report = { results: [{ name: 'Implement a real negative control and repair acceptance', status: 'FAIL' }], hardwareVerified: false }\nmkdirSync('reports', { recursive: true })\nwriteFileSync(${JSON.stringify(c.artifacts.report)}, JSON.stringify(report, null, 2))\nprocess.exitCode = 1\n`)
  fs.writeFileSync(path.join(directory, 'README.md'), `# ${c.title}\n\nDraft from ${url}.\n\nImplement a real negative control, candidate acceptance and owner checks before marking ready. The issue repository may differ from the actual source repository: verify the pinned source before working.\n`)
  fs.writeFileSync(path.join(directory, 'REPORT-TEMPLATE.md'), '# Reproduction\n\nNot run.\n\n# Repair\n\nNot implemented.\n\n# Owner checks\n\nNot verified.\n')
  console.log(`Created draft ${c.id}; no tests or repair claimed.`)
}
function containerRun(c, { harness = false } = {}) {
  const id = harness ? 'harness' : c.id
  const output = path.join(root, 'reports', id)
  fs.rmSync(output, { recursive: true, force: true })
  fs.mkdirSync(output, { recursive: true })
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-v2-'))
  const started = Date.now()
  let bclRevision = 'unknown'
  try {
    try { bclRevision = exec('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: 'pipe' }).trim() } catch {}
    const ignored = new Set(['.git', 'sources', 'reports', 'node_modules', '.cache'])
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (ignored.has(entry.name) || entry.isSymbolicLink()) continue
      fs.cpSync(path.join(root, entry.name), path.join(stage, entry.name), { recursive: true,
        filter: p => !fs.lstatSync(p).isSymbolicLink() })
    }
    for (const source of c?.sources || []) {
      const destination = path.join(stage, source.directory)
      fs.mkdirSync(destination, { recursive: true })
      const git = args => exec('git', ['-c', 'core.hooksPath=/dev/null', '-C', destination, ...args])
      git(['init', '--quiet'])
      git(['remote', 'add', 'origin', `https://github.com/${source.repository}.git`])
      git(['fetch', '--quiet', '--depth=1', 'origin', source.commit])
      git(['checkout', '--quiet', '--detach', 'FETCH_HEAD'])
    }
    const node = c?.runtime.node || '22.20.0'
    const tag = `bcl-runtime:${node}`
    exec('docker', ['build', '--build-arg', `NODE_VERSION=${node}`, '-t', tag, '-f', path.join(root, 'Dockerfile'), root])
    const imageId = exec('docker', ['image', 'inspect', '--format={{.Id}}', tag], { stdio: 'pipe', encoding: 'utf8' }).trim()
    const base = ['run', '--rm', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--pids-limit=256', '--memory=2g', '--cpus=2',
      '--user', `${process.getuid()}:${process.getgid()}`, '--tmpfs', '/tmp:rw,exec,nosuid,size=512m',
      '--mount', `type=bind,source=${stage},target=/work`, '--workdir=/work',
      '-e', 'HOME=/tmp', '-e', 'COREPACK_HOME=/work/.cache/corepack', '-e', 'YARN_CACHE_FOLDER=/work/.cache/yarn',
      '-e', `BCL_REVISION=${bclRevision}`, '-e', `BCL_IMAGE_ID=${imageId}`]
    if (c?.steps.dependencies.length) {
      // Only the audited registry installer runs with network access; never a passport command.
      exec('docker', [...base, '--network=bridge', tag, 'node', 'scripts/dependencies.cjs', c.id])
    }
    const argv = harness ? ['node', '--test', ...fs.readdirSync(path.join(stage, 'test')).filter(n => n.endsWith('.test.mjs')).map(n => `test/${n}`)] : ['node', 'scripts/case.cjs', 'run', c.id]
    try { exec('docker', [...base, '--network=none', '-e', 'BCL_SANDBOX=network-none', tag, ...argv]) }
    finally {
      const bundle = path.join(stage, 'reports', id)
      if (fs.existsSync(bundle)) fs.cpSync(bundle, output, { recursive: true })
      if (c?.artifacts.package) {
        for (const p of require('./evidence.cjs').packages(stage, c.artifacts.package, false)) fs.copyFileSync(path.join(stage, p.path), path.join(output, path.basename(p.path)))
      }
    }
    if (!harness && !fs.existsSync(path.join(output, 'evidence.json'))) throw new Error('Missing evidence bundle')
  } catch (error) {
    if (!harness && !fs.existsSync(path.join(output, 'evidence.json'))) writeEvidence(root, c, { status: 'FAIL', bclRevision, environment: {}, durationMs: Date.now() - started, stages: [{ name: 'setup', status: 'FAIL' }], error: error.message })
    throw error
  } finally { fs.rmSync(stage, { recursive: true, force: true }) }
}
async function main() {
  const [mode, arg] = process.argv.slice(2)
  if (mode === 'new') return create(arg)
  if (mode === 'list') return console.log(all().map(c => `${c.id}\t${c.status}`).join('\n'))
  if (mode === 'validate') return console.log(JSON.stringify(load(arg), null, 2))
  if (mode === 'harness') return containerRun(null, { harness: true })
  if (mode === 'run') { const c = load(arg); if (c.status !== 'ready') throw new Error('Draft case is not executable'); return containerRun(c) }
  throw new Error('Usage: bcl new <issue-url> | list | validate <id> | run <id> | harness')
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1 })
module.exports = { scaffold }
