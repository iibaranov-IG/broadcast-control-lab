const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createHash } = require('node:crypto')
const digest = value => createHash('sha256').update(value).digest('hex')
function context(directory) {
  const sources = new Map(), images = new Map()
  const metrics = { downloads: 0, sourceReuses: 0, imageBuilds: 0, imageReuses: 0, downloadMs: 0, imageBuildMs: 0, copyMs: 0 }
  return {
    metrics,
    source(s, destination, prepare) {
      const key = digest(`${s.repository}@${s.commit}`)
      if (!sources.has(key)) {
        const cache = path.join(directory, key), begin = Date.now()
        const staging = `${cache}.partial`
        fs.rmSync(staging, { recursive: true, force: true })
        try { prepare(staging); fs.renameSync(staging, cache) }
        catch (error) { fs.rmSync(staging, { recursive: true, force: true }); throw error }
        finally { metrics.downloadMs += Date.now() - begin }
        metrics.downloads++
        sources.set(key, cache)
      } else metrics.sourceReuses++
      const begin = Date.now()
      // Never hardlink or mount the shared cache into an executing case.
      fs.cpSync(sources.get(key), destination, { recursive: true })
      metrics.copyMs += Date.now() - begin
    },
    image(key, prepare) {
      if (images.has(key)) { metrics.imageReuses++; return images.get(key) }
      const begin = Date.now(), image = prepare()
      metrics.imageBuildMs += Date.now() - begin
      metrics.imageBuilds++
      images.set(key, image)
      return image
    },
  }
}
function run(root, cases, execute) {
  if (!cases.length || new Set(cases.map(c => c.id)).size !== cases.length) throw new Error('Batch needs distinct case ids')
  for (const c of cases) if (c.status !== 'ready' || !c.upstream) throw new Error(`${c.id}: batch requires ready configuration and upstream red → green`)
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-batch-'))
  const shared = context(temporary), begin = Date.now()
  const report = { schemaVersion: 1, startedAt: new Date().toISOString(), status: 'FAIL', cases: [], unmeasured: ['triage (separate command)', 'engineering repair time', 'publication (separate command)'] }
  try {
    for (const c of cases) {
      const start = Date.now(), before = { ...shared.metrics }
      const item = { case: c.id, status: 'FAIL' }
      try { execute(c, shared); item.status = 'PASS' }
      catch (e) { item.error = e.message }
      item.durationMs = Date.now() - start
      item.preparation = Object.fromEntries(Object.entries(shared.metrics).map(([key, value]) => [key, value - before[key]]))
      item.evidence = `${c.id}/evidence.json`
      report.cases.push(item)
    }
    report.status = report.cases.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL'
    report.completed = true
  } finally {
    report.durationMs = Date.now() - begin
    report.shared = shared.metrics
    const dir = path.join(root, 'reports', 'batches')
    fs.mkdirSync(dir, { recursive: true })
    const name = report.startedAt.replace(/[:.]/g, '-')
    fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(report, null, 2) + '\n')
    fs.writeFileSync(path.join(dir, `${name}.md`), ['# BCL batch performance', '', `Result: ${report.status}; wall time: ${report.durationMs} ms`, '', `Source downloads: ${shared.metrics.downloads}; reuses: ${shared.metrics.sourceReuses}`, `Image builds: ${shared.metrics.imageBuilds}; reuses: ${shared.metrics.imageReuses}`, '', '| Case | Result | Total ms | Evidence |', '| --- | --- | --- | --- |', ...report.cases.map(c => `| ${c.case} | ${c.status} | ${c.durationMs} | ../${c.evidence} |`), '', `Not measured: ${report.unmeasured.join('; ')}.`, 'Patch application time is not engineering repair time.', ''].join('\n'))
    fs.rmSync(temporary, { recursive: true, force: true })
  }
  return report
}
module.exports = { context, run }
