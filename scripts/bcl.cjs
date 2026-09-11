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
async function create(url, options = []) {
  const m = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/issues\/(\d+)\/?$/.exec(url || '')
  if (!m) throw new Error('Usage: bcl new https://github.com/owner/repo/issues/123')
  const read = require('./github-read.cjs').reader()
  const api = p => read(`repos/${m[1]}/${m[2]}/${p}`)
  const issue = await api(`issues/${m[3]}`)
  if (issue.pull_request) throw new Error('Use an issue URL, not a pull request')
  const commits = await api('commits?per_page=1')
  const c = scaffold(url, commits[0].sha, issue.title)
  const templates = require('./templates.cjs')
  const templateFiles = templates.generate(c, templates.options(options))
  const directory = path.join(root, 'cases', c.id)
  if (fs.existsSync(directory)) throw new Error('Case already exists; nothing overwritten')
  fs.mkdirSync(directory)
  fs.writeFileSync(path.join(directory, 'case.json'), JSON.stringify(c, null, 2) + '\n')
  for (const [name, contents] of Object.entries(templateFiles)) fs.writeFileSync(path.join(directory, name), contents)
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
    const allowed = new Set(['cases', 'scripts', 'lib', 'test', 'lab.cjs', 'package.json', 'Dockerfile'])
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!allowed.has(entry.name) || entry.isSymbolicLink()) continue
      fs.cpSync(path.join(root, entry.name), path.join(stage, entry.name), { recursive: true,
        filter: p => !fs.lstatSync(p).isSymbolicLink() && !/^(\.env(?:\..*)?|\.git|node_modules|\.cache)$/.test(path.basename(p)) })
    }
    for (const source of c?.sources || []) {
      const destination = path.join(stage, source.directory)
      fs.mkdirSync(destination, { recursive: true })
      const git = args => exec('git', ['-c', 'core.hooksPath=/dev/null', '-C', destination, ...args])
      git(['init', '--quiet'])
      git(['remote', 'add', 'origin', `https://github.com/${source.repository}.git`])
      require('./retry.cjs').retrySync(() => exec('git', ['-c', 'core.hooksPath=/dev/null', '-C', destination, 'fetch', '--quiet', '--depth=1', 'origin', source.commit], { stdio: 'pipe', timeout: 60000 }))
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
      if (fs.existsSync(bundle)) fs.cpSync(bundle, output, { recursive: true, filter: p => !fs.lstatSync(p).isSymbolicLink() })
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
  const [mode, arg, ...options] = process.argv.slice(2)
  if (mode === 'triage') return console.log(JSON.stringify(await require('./triage.cjs').run(root, arg, options), null, 2))
  if (mode === 'new') return create(arg, options)
  if (mode === 'list') return console.log(all().map(c => `${c.id}\t${c.status}`).join('\n'))
  if (mode === 'validate') return console.log(JSON.stringify(load(arg), null, 2))
  if (mode === 'harness') return containerRun(null, { harness: true })
  if (mode === 'run' || mode === 'test') { const c = load(arg); if (c.status !== 'ready') throw new Error('Draft case is not executable'); return containerRun(c) }
  if (mode === 'publish') {
    const { publish, parseOptions } = require('./publish.cjs')
    return console.log(JSON.stringify(publish(root, load(arg), parseOptions(options)), null, 2))
  }
  if (mode === 'sync') {
    const result = require('./tracking.cjs').sync(root, require('./publish.cjs').api)
    console.log(JSON.stringify(result, null, 2))
    if (result.errors.length) process.exitCode = 1
    return
  }
  if (mode === 'inbox') {
    const db = require('./tracking.cjs').read(root)
    return console.log(JSON.stringify(db.repairs.filter(r => !arg || r.id === arg).map(r => ({ id: r.id, pr: r.pr, syncError: r.syncError, events: r.events.filter(e => !e.read) })), null, 2))
  }
  if (mode === 'ack') {
    const t = require('./tracking.cjs')
    t.acknowledge(root, arg)
    const local = t.read(root).repairs.filter(r => r.id === arg)
    return console.log(JSON.stringify(t.remoteUpdate(root, db => {
      for (const r of db.repairs.filter(r => r.id === arg)) {
        const prior = local.find(p => p.pr === r.pr)
        for (const e of r.events) if (prior?.events.some(p => p.key === e.key && p.updatedAt === e.updatedAt && p.body === e.body && p.state === e.state && p.read)) e.read = true
        r.unread = r.events.filter(e => !e.read).length
      }
    }, `Acknowledge ${arg} replies`, require('./publish.cjs').api), null, 2))
  }
  if (mode === 'hardware-result') {
    if (options[0] !== '--file' || options.length !== 2) throw new Error('Use bcl hardware-result <id> --file <owner-result.json>')
    const t = require('./tracking.cjs')
    t.importHardware(root, arg, options[1])
    const report = JSON.parse(fs.readFileSync(options[1]))
    const local = t.read(root).repairs.find(r => r.id === arg && r.candidateSha256 === report.candidateSha256)
    return console.log(JSON.stringify(t.remoteUpdate(root, db => {
      const remote = db.repairs.find(r => r.id === arg && r.candidateSha256 === report.candidateSha256)
      if (!remote) throw new Error('Remote board has no matching candidate')
      remote.hardware = local.hardware
    }, `Record ${arg} hardware report`, require('./publish.cjs').api), null, 2))
  }
  if (mode === 'hardware-kit') {
    const c = load(arg), directory = path.join(root, 'reports', c.id)
    require('./publication.cjs').hardwareKit(directory, c)
    return console.log(path.join(directory, 'HARDWARE-CHECK.md'))
  }
  throw new Error('Usage: bcl triage <issue-url> [--source owner/repo] [--ref revision] [--dependency url] | new <issue-url> | list | validate <id> | test <id> | publish <id> --fork owner/repo --run <url> [--dry-run] | hardware-kit <id> | sync | inbox [id] | ack <id> | hardware-result <id> --file <path> | harness')
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1 })
module.exports = { scaffold }
