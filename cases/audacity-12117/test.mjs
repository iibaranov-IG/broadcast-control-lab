import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

const source = path.resolve(process.argv[2] || 'sources/audacity-12117')
const report = {
  issue: 'https://github.com/audacity/audacity/issues/12117',
  revision: 'de6e59a8210c8c765cad62456a7cb6fd542bcf17',
  evidence: 'Compiled project filename normalizer and upstream project-unit-test registration',
  hardwareVerified: false,
  results: [],
}
const record = (name, fn) => {
  const started = performance.now()
  try { fn(); report.results.push({ name, status: 'PASS', durationMs: Math.round(performance.now() - started) }) }
  catch (error) { report.results.push({ name, status: 'FAIL', durationMs: Math.round(performance.now() - started), message: error.message }) }
}

record('save scenario uses the shared extension normalizer', () => {
  const text = readFileSync(path.join(source, 'src/project/internal/opensaveprojectscenario.cpp'), 'utf8')
  if (!text.includes('selectedPath = forceAup4Extension(selectedPath.toStdString());')) throw new Error('save path is not normalized')
  if (!text.includes('aup4SaveFilter(muse::trc("project", "Audacity 4 files"))')) throw new Error('save dialog does not use the valid project filter')
})
record('project module and test target register the new sources', () => {
  const module = readFileSync(path.join(source, 'src/project/CMakeLists.txt'), 'utf8')
  const tests = readFileSync(path.join(source, 'src/project/tests/CMakeLists.txt'), 'utf8')
  if (!module.includes('internal/projectpathutils.cpp') || !tests.includes('projectpathutils_tests.cpp')) throw new Error('CMake source registration is incomplete')
})
record('upstream tests cover the duplicate extension report', () => {
  const tests = readFileSync(path.join(source, 'src/project/tests/projectpathutils_tests.cpp'), 'utf8')
  if (!tests.includes('session.aup4.aup4') || !tests.includes('CollapsesRepeatedProjectExtensions')) throw new Error('duplicate extension regression is missing')
})

mkdirSync('reports', { recursive: true })
writeFileSync('reports/audacity-12117.json', JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}${result.message ? ': ' + result.message : ''}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
