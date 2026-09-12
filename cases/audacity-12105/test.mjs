import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const source = path.resolve(process.argv[2] || 'sources/audacity-12105')
const scenario = readFileSync(path.join(source, 'src/project/internal/opensaveprojectscenario.cpp'), 'utf8')
const implementation = readFileSync(path.join(source, 'src/project/internal/projectpathutils.cpp'), 'utf8')
const tests = readFileSync(path.join(source, 'src/project/tests/projectpathutils_tests.cpp'), 'utf8')
const results = [
  ['save dialog uses the shared filter builder', scenario.includes('aup4SaveFilter(muse::trc("project", "Audacity 4 files"))')],
  ['filter builder emits one valid pattern group', implementation.includes('return label + " (*.aup4)";')],
  ['upstream regression covers the filter grammar', tests.includes('CreatesAValidProjectFileFilter')],
].map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' }))
mkdirSync('reports', { recursive: true })
writeFileSync('reports/audacity-12105.json', JSON.stringify({ issue: 'https://github.com/audacity/audacity/issues/12105', revision: 'de6e59a8210c8c765cad62456a7cb6fd542bcf17', hardwareVerified: false, results }, null, 2) + '\n')
for (const result of results) console.log(`${result.status}: ${result.name}`)
if (results.some(result => result.status === 'FAIL')) process.exitCode = 1
