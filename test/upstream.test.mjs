import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { clearBytecode, session, suiteSummary } from '../scripts/upstream.cjs'
import { execFileSync } from 'node:child_process'
import { context, run } from '../scripts/batch.cjs'
import { writeEvidence } from '../scripts/evidence.cjs'

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-upstream-test-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const source = path.join(root, 'sources/example'); fs.mkdirSync(source, { recursive: true })
  fs.writeFileSync(path.join(source, 'impl.cjs'), 'module.exports = () => 1\n')
  fs.writeFileSync(path.join(source, 'regression.cjs'), "if (require('./impl.cjs')() !== 2) { console.error('WRONG_RESULT'); process.exit(1) }\n")
  fs.writeFileSync(path.join(source, 'suite.cjs'), "require('./regression.cjs'); console.log('# tests 1')\n")
  const c = { id: 'example', sources: [{ id: 'main', directory: 'sources/example' }], artifacts: {}, verification: {}, upstream: { kind: 'node', source: 'main', setup: [], build: [], timeoutMs: 1000, testFiles: ['regression.cjs', 'suite.cjs'], regression: { cwd: '.', argv: [process.execPath, 'regression.cjs'] }, suite: { cwd: '.', argv: [process.execPath, 'suite.cjs'] }, negative: { exitCode: 1, outputIncludes: 'WRONG_RESULT' }, suiteOutputIncludes: '# tests 1' } }
  const execution = { stages: [], status: 'FAIL' }
  return { root, source, c, execution, s: session(root, c, execution), repair: () => fs.writeFileSync(path.join(source, 'impl.cjs'), 'module.exports = () => 2\n') }
}
test('real subprocess regression is red before repair, green after; suite logs are hashed in evidence', t => {
  const f = fixture(t); f.s.baseline(); f.repair(); f.s.candidate()
  assert.equal(f.execution.upstream.status, 'PASS')
  assert.deepEqual(f.execution.upstream.commands.map(c => c.exitCode), [1, 0, 0])
  const evidence = writeEvidence(f.root, f.c, f.execution)
  assert.equal(evidence.logs.length, 3)
  assert.ok(evidence.logs.every(l => /^[a-f0-9]{64}$/.test(l.sha256)))
})
test('already-green baseline, wrong diagnostic and missing executable cannot qualify', t => {
  const f = fixture(t); f.repair(); assert.throws(() => f.s.baseline(), /contract/)
  const g = fixture(t); g.c.upstream.negative.outputIncludes = 'OTHER_DEFECT'; assert.throws(() => g.s.baseline(), /contract/)
  const h = fixture(t); h.c.upstream.regression.argv = ['bcl-no-such-program']; assert.throws(() => h.s.baseline(), /contract/)
  assert.equal(h.execution.upstream.status, 'FAIL')
})
test('changed regression, failing suite and missing completion marker cannot qualify', t => {
  const f = fixture(t); f.s.baseline(); f.repair(); fs.appendFileSync(path.join(f.source, 'regression.cjs'), '// changed'); assert.throws(() => f.s.candidate(), /changed/)
  const g = fixture(t); g.s.baseline(); g.repair(); g.c.upstream.suiteOutputIncludes = 'missing marker'; assert.throws(() => g.s.candidate(), /contract/)
  const h = fixture(t); h.s.baseline(); h.repair(); h.c.upstream.suite = { cwd: '.', argv: [process.execPath, '-e', 'process.exit(1)'] }; assert.throws(() => h.s.candidate(), /contract/)
})
test('nine cases reuse one download and image with independent copies', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-batch-test-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const ctx = context(path.join(root, 'cache'))
  const source = { repository: 'owner/project', commit: 'a'.repeat(40) }
  for (let i = 0; i < 9; i++) {
    const destination = path.join(root, `case-${i}`)
    ctx.source(source, destination, dir => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'code'), 'baseline') })
    assert.equal(fs.readFileSync(path.join(destination, 'code'), 'utf8'), 'baseline')
    fs.writeFileSync(path.join(destination, 'code'), `repair-${i}`)
    assert.equal(ctx.image('same-runtime', () => 'sha256:image'), 'sha256:image')
  }
  assert.equal(ctx.metrics.downloads, 1); assert.equal(ctx.metrics.sourceReuses, 8)
  assert.equal(ctx.metrics.imageBuilds, 1); assert.equal(ctx.metrics.imageReuses, 8)
  assert.equal(fs.readFileSync(path.join(root, 'case-0/code'), 'utf8'), 'repair-0')
})
test('shared source copies preserve relative symbolic links verbatim', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-symlink-test-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const ctx = context(path.join(root, 'cache'))
  const source = { repository: 'owner/project', commit: 'b'.repeat(40) }
  const destination = path.join(root, 'case')
  ctx.source(source, destination, dir => {
    fs.mkdirSync(path.join(dir, '.github'), { recursive: true })
    fs.writeFileSync(path.join(dir, '.github/instructions.md'), 'rules\n')
    fs.symlinkSync('.github/instructions.md', path.join(dir, 'AGENTS.md'))
  })
  assert.equal(fs.readlinkSync(path.join(destination, 'AGENTS.md')), '.github/instructions.md')
})
test('Python red/green invalidates timestamp bytecode even for same-size rapid repair', t => {
  const f = fixture(t)
  const filename = path.join(f.source, 'impl.py'), stamp = new Date(1000000000000)
  fs.writeFileSync(filename, 'def value(): return 1\n'); fs.utimesSync(filename, stamp, stamp)
  fs.writeFileSync(path.join(f.source, 'regression.py'), 'import impl\nassert impl.value() == 2, "WRONG_RESULT"\n')
  Object.assign(f.c.upstream, { kind: 'python', testFiles: ['regression.py'], regression: { cwd: '.', argv: ['python3', 'regression.py'] }, suite: { cwd: '.', argv: ['python3', '-c', 'import regression; print("Ran 1 test")'] }, suiteOutputIncludes: 'Ran 1 test' })
  f.s.baseline()
  fs.writeFileSync(filename, 'def value(): return 2\n'); fs.utimesSync(filename, stamp, stamp)
  f.s.candidate(); assert.equal(f.execution.upstream.status, 'PASS')
  assert.equal(fs.existsSync(path.join(f.source, '__pycache__')), false)
})
test('Python bytecode cleanup tolerates vanished and case-colliding checkout paths', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-bytecode-test-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const cache = path.join(root, '__pycache__')
  fs.mkdirSync(cache)
  fs.writeFileSync(path.join(cache, 'module.pyc'), 'stale')
  clearBytecode(root)
  assert.equal(fs.existsSync(cache), false)
  assert.doesNotThrow(() => clearBytecode(path.join(root, 'GoNoGo')))
})
test('baseline setup may not apply production repairs', t => {
  const f = fixture(t)
  const git = args => execFileSync('git', ['-C', f.source, ...args], { stdio: 'pipe' })
  git(['init', '-q']); git(['add', '.']); git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'baseline'])
  f.c.upstream.setup = [{ cwd: '.', argv: [process.execPath, '-e', 'require("fs").writeFileSync("impl.cjs", "module.exports=()=>2")'] }]
  assert.throws(() => f.s.baseline(), /modified production/)
})
test('dirty baseline error identifies every tracked file', t => {
  const f = fixture(t)
  const git = args => execFileSync('git', ['-C', f.source, ...args], { stdio: 'pipe' })
  git(['init', '-q']); git(['add', '.']); git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'baseline'])
  fs.appendFileSync(path.join(f.source, 'impl.cjs'), '// dirty\n')
  fs.appendFileSync(path.join(f.source, 'suite.cjs'), '// dirty\n')
  assert.throws(() => f.s.baseline(), /impl\.cjs, suite\.cjs/)
})
test('empty or entirely skipped suites do not qualify; supported summaries record totals', () => {
  assert.throws(() => suiteSummary('python', 'Ran 0 tests'), /nonempty/)
  assert.throws(() => suiteSummary('python', 'Ran 2 tests\nOK (skipped=2)'), /nonempty/)
  assert.equal(suiteSummary('cpp-cmake', '100% tests passed, 0 tests failed out of 24').total, 24)
  assert.equal(suiteSummary('cpp-autotools', '# TOTAL: 5\n# SKIP: 1').skipped, 1)
  assert.deepEqual(
    suiteSummary('rust', 'test result: ok. 86 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out\ntest result: ok. 1 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out'),
    { total: 89, skipped: 2, parser: 'rust', source: 'upstream output; successful exit required' },
  )
  assert.throws(() => suiteSummary('rust', 'test result: ok. 0 passed; 0 failed; 4 ignored;'), /nonempty/)
})
test('batch rejects contract-only cases before preparation and continues after individual failure', t => {
  const f = fixture(t)
  assert.throws(() => run(f.root, [{ id: 'legacy', status: 'ready' }], () => assert.fail()), /red/)
  const cases = ['one', 'two'].map(id => ({ id, status: 'ready', upstream: {} }))
  const report = run(f.root, cases, c => { if (c.id === 'one') throw new Error('broken patch') })
  assert.deepEqual(report.cases.map(c => c.status), ['FAIL', 'PASS'])
  assert.equal(report.status, 'FAIL')
  assert.ok(report.unmeasured.includes('engineering repair time'))
})
