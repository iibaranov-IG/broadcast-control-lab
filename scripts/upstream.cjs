const fs = require('node:fs')
const path = require('node:path')
const { spawnSync, execFileSync } = require('node:child_process')
const { createHash } = require('node:crypto')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
function suiteSummary(kind, text) {
  const totalMatch = kind === 'python' ? /Ran (\d+) tests?\b/.exec(text) : kind === 'cpp-cmake' ? /tests failed out of (\d+)/.exec(text) : kind === 'cpp-autotools' ? /# TOTAL:\s*(\d+)/.exec(text) : /(?:#|ℹ) tests\s+(\d+)/.exec(text)
  const skippedMatch = kind === 'python' ? /skipped=(\d+)/.exec(text) : kind === 'cpp-autotools' ? /# SKIP:\s*(\d+)/.exec(text) : kind === 'node' ? /(?:#|ℹ) skipped\s+(\d+)/.exec(text) : null
  const total = Number(totalMatch?.[1] || 0)
  const skipped = kind === 'cpp-cmake' ? (text.match(/^\s*\d+\s+-\s+.*\((?:Skipped|Disabled|Not Run)\)\s*$/gm) || []).length : Number(skippedMatch?.[1] || 0)
  if (kind === 'cpp-cmake' && /tests did not run/i.test(text) && skipped === 0) throw new Error('Unrecognized CTest skipped-test summary')
  if (total <= 0 || skipped >= total) throw new Error('Upstream suite has no recognized nonempty executed-test summary')
  return { total, skipped, parser: kind, source: 'upstream output; successful exit required' }
}
function validate(c, relative) {
  const u = c.upstream
  if (!u) return
  if (!['cpp-cmake', 'cpp-autotools', 'python', 'node'].includes(u.kind)) throw new Error('Unsupported upstream kind')
  if (!c.sources.some(s => s.id === u.source)) throw new Error('Unknown upstream source')
  if (c.publish && c.publish.source !== u.source) throw new Error('Upstream and publication must use the same source')
  for (const key of ['setup', 'build']) if (!Array.isArray(u[key])) throw new Error(`Missing upstream ${key}`)
  for (const step of [...u.setup, ...u.build, u.regression, u.suite]) {
    if (!step) throw new Error('Missing upstream command')
    relative(step.cwd)
    if (!Array.isArray(step.argv) || !step.argv.length || step.argv.some(a => typeof a !== 'string' || !a)) throw new Error('Invalid upstream argv')
  }
  if (!Number.isInteger(u.timeoutMs) || u.timeoutMs < 100 || u.timeoutMs > 600000) throw new Error('Upstream timeout must be 100..600000 ms per command')
  if (!Number.isInteger(u.negative?.exitCode) || u.negative.exitCode < 1 || u.negative.exitCode > 125 || !u.negative.outputIncludes?.trim()) throw new Error('Upstream negative check needs an exact exit code and diagnostic')
  if (!u.suiteOutputIncludes?.trim()) throw new Error('Upstream suite needs a completion marker')
  if (!Array.isArray(u.testFiles) || !u.testFiles.length) throw new Error('Declare unchanged upstream regression test files')
  u.testFiles.forEach(relative)
}
function session(root, c, execution) {
  const u = c.upstream
  const source = path.join(root, c.sources.find(s => s.id === u.source).directory)
  const directory = path.join(root, 'reports', c.id)
  fs.mkdirSync(directory, { recursive: true })
  const result = execution.upstream = { kind: u.kind, source: u.source, status: 'FAIL', commands: [], logs: [], testFiles: [] }
  const inside = p => {
    const real = fs.realpathSync(path.join(source, p))
    if (real !== fs.realpathSync(source) && !real.startsWith(fs.realpathSync(source) + path.sep)) throw new Error('Upstream path escapes source')
    return real
  }
  const tests = () => u.testFiles.map(p => ({ path: p, sha256: hash(fs.readFileSync(inside(p))) }))
  const trackedChanges = () => execFileSync('git', ['-C', source, 'diff', '--name-only', 'HEAD'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  function clearBytecode(directory) {
    for (const e of fs.readdirSync(directory, { withFileTypes: true })) {
      if (e.isSymbolicLink() || ['.git', '.venv', 'node_modules'].includes(e.name)) continue
      const p = path.join(directory, e.name)
      if (e.isDirectory() && e.name === '__pycache__') fs.rmSync(p, { recursive: true })
      else if (e.isDirectory()) clearBytecode(p)
      else if (e.isFile() && /\.py[co]$/.test(e.name)) fs.unlinkSync(p)
    }
  }
  function command(label, step, expected = 0, marker = '') {
    const name = `upstream-${result.commands.length + 1}-${label}.log`
    const filename = path.join(directory, name)
    const fd = fs.openSync(filename, 'w')
    const begin = Date.now()
    let processResult
    try { processResult = spawnSync(step.argv[0], step.argv.slice(1), { cwd: inside(step.cwd), shell: false, timeout: u.timeoutMs, stdio: ['ignore', fd, fd] }) }
    finally { fs.closeSync(fd) }
    const bytes = fs.readFileSync(filename)
    const entry = { label, argv: step.argv, cwd: step.cwd, exitCode: processResult.status, signal: processResult.signal, durationMs: Date.now() - begin, status: 'FAIL', log: name }
    result.commands.push(entry)
    result.logs.push({ path: name, bytes: bytes.length, sha256: hash(bytes) })
    if (processResult.error || processResult.signal || processResult.status !== expected || (marker && !bytes.toString('utf8').includes(marker))) {
      const text = bytes.toString('utf8')
      entry.failureClass = processResult.error?.code === 'ENOENT' || /ModuleNotFoundError|No module named|cannot find -l|Could NOT find/.test(text) ? 'ENVIRONMENT_DEPENDENCY' : processResult.error?.code === 'ETIMEDOUT' || processResult.signal ? 'TIMEOUT_OR_SIGNAL' : /Could not resolve host|Network is unreachable|Connection timed out/.test(text) ? 'NETWORK' : /patch does not apply|patch failed:/.test(text) ? 'PATCH_APPLICATION' : /unsupported platform|not supported on this platform/i.test(text) ? 'PLATFORM' : 'TEST_OR_CONTRACT'
      entry.classificationConfidence = 'HEURISTIC_REVIEW_REQUIRED'
      console.error(text.slice(-16000))
      throw new Error(`Upstream ${label} did not meet its exit/diagnostic contract (${entry.failureClass}); see ${name}`)
    }
    entry.status = 'PASS'
    console.log(`[upstream] ${label}: PASS (exit ${processResult.status})`)
    return bytes.toString('utf8')
  }
  return {
    baseline() {
      if (fs.existsSync(path.join(source, '.git')) && trackedChanges().length) throw new Error('Upstream baseline already contains tracked modifications')
      u.setup.forEach(step => command('setup', step))
      if (fs.existsSync(path.join(source, '.git')) && trackedChanges().some(p => !u.testFiles.includes(p))) throw new Error('Baseline setup modified production files outside declared regression tests')
      if (u.kind === 'python') clearBytecode(source)
      u.build.forEach(step => command('baseline-build', step))
      result.testFiles = tests()
      command('baseline-red', u.regression, u.negative.exitCode, u.negative.outputIncludes)
      if (JSON.stringify(tests()) !== JSON.stringify(result.testFiles)) throw new Error('Regression test files changed during baseline execution')
      result.baseline = 'EXPECTED_FAILURE'
    },
    candidate() {
      if (result.baseline !== 'EXPECTED_FAILURE') throw new Error('Missing upstream negative control')
      if (JSON.stringify(tests()) !== JSON.stringify(result.testFiles)) throw new Error('Repair changed the upstream regression test files')
      if (u.kind === 'python') clearBytecode(source)
      u.build.forEach(step => command('candidate-build', step))
      command('candidate-green', u.regression)
      result.suiteSummary = suiteSummary(u.kind, command('candidate-suite', u.suite, 0, u.suiteOutputIncludes))
      console.log(`[upstream] suite total=${result.suiteSummary.total}, skipped=${result.suiteSummary.skipped}`)
      if (JSON.stringify(tests()) !== JSON.stringify(result.testFiles)) throw new Error('Upstream tests changed during candidate execution')
      result.status = 'PASS'
    },
  }
}
module.exports = { validate, session, suiteSummary }
