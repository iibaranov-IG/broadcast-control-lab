const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const root = path.resolve(__dirname, '..')
const { writeEvidence, packages } = require('./evidence.cjs')
function load(id) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || '')) throw new Error('Invalid case id')
  const c = JSON.parse(fs.readFileSync(path.join(root, 'cases', id, 'case.json'), 'utf8'))
  if (c.schemaVersion !== 1 || c.id !== id) throw new Error('Unsupported passport or mismatched id')
  for (const key of ['title', 'issue', 'problem', 'reproduce', 'acceptance', 'repair', 'packageVersion']) {
    if (typeof c[key] !== 'string' || !c[key].trim()) throw new Error(`Missing ${key}`)
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(c.source?.repository) || !/^[a-f0-9]{40}$/.test(c.source?.commit)) throw new Error('Source must name a repository and immutable commit')
  if (!/^\d+\.\d+\.\d+$/.test(c.runtime?.node)) throw new Error('Pin a Node version')
  const relative = value => {
    if (typeof value !== 'string' || /[\r\n]/.test(value) || path.isAbsolute(value) || value.split(/[\\/]/).includes('..')) throw new Error('Expected repository-relative path')
  }
  relative(c.source.directory); relative(c.source.path)
  relative(c.artifacts?.package); relative(c.artifacts?.report)
  for (const phase of ['prepare', 'test', 'build']) {
    if (!Array.isArray(c.steps?.[phase]) || !c.steps[phase].length) throw new Error(`Missing ${phase} steps`)
    for (const step of c.steps[phase]) {
      relative(step.cwd)
      if (!Array.isArray(step.argv) || !step.argv.length || step.argv.some(x => typeof x !== 'string' || !x.length)) throw new Error('Commands must be argument arrays')
    }
  }
  for (const key of ['hardwareVerified', 'companionUiVerified']) if (typeof c.verification?.[key] !== 'boolean') throw new Error(`Missing ${key}`)
  for (const key of ['limitations', 'ownerCheck']) if (!c.verification?.[key]) throw new Error(`Missing ${key}`)
  return c
}
function main() {
  const [mode, id] = process.argv.slice(2)
  if (mode === 'list') {
    const ids = fs.readdirSync(path.join(root, 'cases')).filter(id => fs.existsSync(path.join(root, 'cases', id, 'case.json'))).sort()
    ids.forEach(load)
    console.log(JSON.stringify(ids)); return
  }
  const c = load(id)
  if (mode === 'metadata') {
    if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT required')
    const values = { repository: c.source.repository, revision: c.source.commit, directory: c.source.directory, node: c.runtime.node, package: c.artifacts.package, report: c.artifacts.report }
    fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(values).map(([k, v]) => `${k}=${v}\n`).join('')); return
  }
  if (mode === 'validate') { console.log(`${id}: passport valid`); return }
  if (mode !== 'run') throw new Error('Usage: node scripts/case.cjs list|validate|metadata|run [case-id]')
  const execution = { status: 'FAIL', node: process.versions.node, stages: [] }
  try {
  execution.bclRevision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  if (process.versions.node !== c.runtime.node) throw new Error(`Use Node ${c.runtime.node}`)
  const revision = execFileSync('git', ['-C', path.join(root, c.source.directory), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  if (revision !== c.source.commit) throw new Error('Checkout does not match passport')
  // Clear previous test output so a failed run cannot reuse an old PASS report.
  fs.rmSync(path.join(root, c.artifacts.report), { force: true })
  for (const phase of ['prepare', 'test', 'build']) {
    const stage = { name: phase, status: 'FAIL' }
    execution.stages.push(stage)
    console.log(`${id}: ${phase}`)
    for (const { cwd, argv } of c.steps[phase]) execFileSync(argv[0], argv.slice(1), { cwd: path.resolve(root, cwd), stdio: 'inherit', shell: false })
    stage.status = 'PASS'
  }
  execution.packages = packages(root, c.artifacts.package)
  const report = JSON.parse(fs.readFileSync(path.join(root, c.artifacts.report), 'utf8'))
  if (!Array.isArray(report.results) || !report.results.length || report.results.some(r => r.status !== 'PASS')) throw new Error('Missing or unsuccessful test results')
  execution.tests = report.results
  execution.status = 'PASS'
  } catch (error) {
    execution.error = error.message
    throw error
  } finally {
    writeEvidence(root, c, execution)
  }
}
if (require.main === module) main()
module.exports = { load }
