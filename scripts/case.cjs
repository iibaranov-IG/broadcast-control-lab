const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { performance } = require('node:perf_hooks')
const { writeEvidence, packages } = require('./evidence.cjs')
const root = path.resolve(__dirname, '..')
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
function relative(value) {
  if (typeof value !== 'string' || !value || /[\r\n\\]/.test(value) || path.isAbsolute(value) || value.split('/').includes('..')) throw new Error('Expected repository-relative path')
}
function validate(c, id = c.id) {
  if (!idPattern.test(id || '') || c.id !== id || c.schemaVersion !== 2) throw new Error('Expected v2 passport and matching id')
  if (!['ready', 'draft', 'diagnostic'].includes(c.status)) throw new Error('Invalid case status')
  for (const key of ['title', 'issue', 'problem', 'reproduce', 'acceptance', 'repair']) if (typeof c[key] !== 'string' || !c[key].trim()) throw new Error(`Missing ${key}`)
  if (!Array.isArray(c.sources) || !c.sources.length) throw new Error('Missing sources')
  const dirs = new Set(), ids = new Set()
  for (const s of c.sources) {
    if (!idPattern.test(s.id || '') || ids.has(s.id)) throw new Error('Invalid or duplicate source id')
    ids.add(s.id)
    if (!/^[\w.-]+\/[\w.-]+$/.test(s.repository) || !/^[a-f0-9]{40}$/.test(s.commit)) throw new Error('Pin each source to an immutable commit')
    relative(s.directory)
    if (!s.directory.startsWith('sources/') || dirs.has(s.directory) || [...dirs].some(d => d.startsWith(s.directory + '/') || s.directory.startsWith(d + '/'))) throw new Error('Source directories must be distinct and below sources/')
    if (s.sparsePaths !== undefined) {
      if (!Array.isArray(s.sparsePaths) || !s.sparsePaths.length || new Set(s.sparsePaths).size !== s.sparsePaths.length) throw new Error('Source sparsePaths must be a nonempty distinct path list')
      s.sparsePaths.forEach(relative)
    }
    dirs.add(s.directory)
  }
  for (const lang of ['node', 'python']) if (c.runtime?.[lang] && !/^\d+\.\d+\.\d+$/.test(c.runtime[lang])) throw new Error(`Pin ${lang} version`)
  if (!c.runtime?.node) throw new Error('Node runtime required by runner')
  for (const phase of ['dependencies', 'prepare', 'test', 'build']) {
    if (!Array.isArray(c.steps?.[phase]) || (phase === 'test' && !c.steps[phase].length)) throw new Error(`Invalid ${phase} steps`)
    for (const step of c.steps[phase]) {
      relative(step.cwd)
      if (!Array.isArray(step.argv) || !step.argv.length || step.argv.some(v => typeof v !== 'string' || !v.length)) throw new Error('Use argv arrays')
    }
  }
  for (const key of ['report', 'package']) if (c.artifacts?.[key]) relative(c.artifacts[key])
  if (!c.artifacts?.report) throw new Error('Missing report')
  if (c.artifacts.package && !c.packageVersion) throw new Error('Missing package version')
  for (const key of ['report', 'package']) if (c.artifacts[key] && !/^(reports|sources)\//.test(c.artifacts[key])) throw new Error('Artifacts must stay below reports/ or sources/')
  if (!Array.isArray(c.watch)) throw new Error('Missing watch paths')
  c.watch.forEach(relative)
  for (const key of ['hardwareVerified', 'applicationVerified']) if (typeof c.verification?.[key] !== 'boolean') throw new Error(`Missing ${key}`)
  for (const key of ['limitations', 'ownerCheck']) if (!c.verification?.[key]) throw new Error(`Missing ${key}`)
  require('./publication.cjs').validatePublication(c)
  require('./upstream.cjs').validate(c, relative)
  return c
}
function load(id) {
  if (!idPattern.test(id || '')) throw new Error('Invalid case id')
  return validate(JSON.parse(fs.readFileSync(path.join(root, 'cases', id, 'case.json'), 'utf8')), id)
}
function all() {
  return fs.readdirSync(path.join(root, 'cases')).filter(id => fs.existsSync(path.join(root, 'cases', id, 'case.json'))).sort().map(load)
}
function select(cases, changed) {
  if (!changed || changed.some(p => /^(scripts\/|lib\/|test\/|\.github\/workflows\/|package\.json$|Dockerfile$|lab\.cjs$)/.test(p))) return cases.map(c => c.id)
  return cases.filter(c => changed.some(p => p.startsWith(`cases/${c.id}/`) || c.watch.some(w => p === w || p.startsWith(w.replace(/\/$/, '') + '/')))).map(c => c.id)
}
function command(step) { execFileSync(step.argv[0], step.argv.slice(1), { cwd: path.join(root, step.cwd), stdio: 'inherit', shell: false }) }
function run(c) {
  if (!['ready', 'diagnostic'].includes(c.status)) throw new Error('Draft case: implement reproduction and acceptance before execution')
  if (process.env.BCL_SANDBOX !== 'network-none') throw new Error('Use bcl run: case execution requires the offline container')
  const started = performance.now()
  const execution = { status: 'FAIL', bclRevision: process.env.BCL_REVISION || 'unknown', environment: {}, stages: [], packages: [] }
  try {
    if (c.upstream) {
      const selection = require('./selection-gate.cjs').load(root, c)
      const directory = path.join(root, 'reports', c.id)
      fs.mkdirSync(directory, { recursive: true })
      fs.writeFileSync(path.join(directory, 'triage.json'), selection.bytes)
      execution.selection = { path: 'triage.json', sha256: c.selection.sha256 }
    }
    fs.rmSync(path.join(root, c.artifacts.report), { force: true })
    if (process.versions.node !== c.runtime.node) throw new Error(`Use Node ${c.runtime.node}`)
    execution.environment.node = process.versions.node
    if (c.runtime.python) {
      const version = execFileSync('python3', ['--version'], { encoding: 'utf8' }).trim()
      execution.environment.python = version
      if (version !== `Python ${c.runtime.python}`) throw new Error(`Use Python ${c.runtime.python}`)
    }
    execution.environment.platform = `${process.platform}/${process.arch}`
    execution.environment.image = process.env.BCL_IMAGE_ID || 'unknown'
    for (const s of c.sources) {
      const revision = execFileSync('git', ['-C', path.join(root, s.directory), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
      if (revision !== s.commit) throw new Error(`Source mismatch: ${s.id}`)
    }
    if (c.artifacts.package) {
      for (const item of packages(root, c.artifacts.package, false)) fs.unlinkSync(path.join(root, item.path))
    }
    const upstream = c.upstream ? require('./upstream.cjs').session(root, c, execution) : null
    if (upstream) {
      const stage = { name: 'upstream-baseline', status: 'FAIL', durationMs: 0 }
      execution.stages.push(stage)
      const begin = performance.now()
      try { upstream.baseline(); stage.status = 'PASS' }
      finally { stage.durationMs = Math.round(performance.now() - begin) }
    }
    for (const phase of ['prepare', 'test', 'build']) {
      const stage = { name: phase, status: 'FAIL', durationMs: 0 }
      execution.stages.push(stage)
      const begin = performance.now()
      try {
        if (phase === 'test' && upstream) upstream.candidate()
        c.steps[phase].forEach(command)
        if (phase === 'prepare' && c.publish) {
          const { capture, hash } = require('./publication.cjs')
          const bytes = capture(root, c)
          const directory = path.join(root, 'reports', c.id)
          fs.mkdirSync(directory, { recursive: true })
          fs.writeFileSync(path.join(directory, 'candidate.json'), bytes)
          execution.publication = { path: 'candidate.json', sha256: hash(bytes) }
        }
        if (phase === 'test') {
          const report = JSON.parse(fs.readFileSync(path.join(root, c.artifacts.report), 'utf8'))
          execution.tests = report.results
          if (!Array.isArray(report.results) || !report.results.length || report.results.some(r => r.status !== 'PASS')) throw new Error('Missing or unsuccessful test results')
        }
        stage.status = c.steps[phase].length ? 'PASS' : 'NOT_APPLICABLE'
      } finally { stage.durationMs = Math.round(performance.now() - begin) }
    }
    if (c.artifacts.package) execution.packages = packages(root, c.artifacts.package)
    if (c.publish) {
      const { capture, hash } = require('./publication.cjs')
      if (hash(capture(root, c)) !== execution.publication.sha256) throw new Error('Published source changed during test/build; move source edits to prepare')
    }
    execution.qualification = execution.upstream?.status === 'PASS' ? 'RED_GREEN' : 'CONTRACT_ONLY'
    execution.status = 'PASS'
  } catch (error) { execution.error = error.message; throw error }
  finally {
    execution.durationMs = Math.round(performance.now() - started)
    writeEvidence(root, c, execution)
    require('./publication.cjs').hardwareKit(path.join(root, 'reports', c.id), c)
  }
}
function main() {
  const [mode, id] = process.argv.slice(2)
  if (mode === 'list') { console.log(JSON.stringify(all().map(c => c.id))); return }
  if (mode === 'select') {
    const changed = id ? execFileSync('git', ['diff', '--name-only', '--no-renames', `${id}...HEAD`], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean) : null
    console.log(JSON.stringify(select(all(), changed))); return
  }
  const c = load(id)
  if (mode === 'validate') { console.log(`${id}: valid v2 ${c.status}`); return }
  if (mode === 'run') { run(c); return }
  throw new Error('Use bcl list|validate|new|run, or case.cjs select')
}
if (require.main === module) main()
module.exports = { load, validate, all, select, root }
