import fs from 'node:fs'
import path from 'node:path'

const root = process.argv[2]
const sourcePath = path.join(root, 'src/renderer/api/subsonic/subsonic-controller.ts')
const source = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8') : ''
const decisionStart = source.indexOf('const transcodeDecision = await ssApiClient(apiClientProps)')
const statusFallback = source.indexOf('if (transcodeDecision.status !== 200)', decisionStart)
const decisionBlock = source.slice(decisionStart, statusFallback)

const checks = [
  ['decision request catches transport and CORS failures', /\.getTranscodeDecision\([\s\S]*?\)\s*\.catch\(\(error: unknown\) => \{/.test(decisionBlock)],
  ['fallback is recorded for diagnosis', /logger\.warn\([\s\S]*?falling back to direct stream/.test(decisionBlock)],
  ['request failure maps to an explicit null decision', /return null;/.test(decisionBlock)],
  ['missing decision returns the direct stream URL', /if \(!transcodeDecision\) \{\s*return streamUrl;\s*\}/.test(decisionBlock)],
  ['non-200 decisions still return the direct stream URL', /if \(transcodeDecision\.status !== 200\) \{[\s\S]*?return streamUrl;/.test(source.slice(statusFallback, statusFallback + 400))],
]
const results = checks.map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' }))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/feishin-2451.json', JSON.stringify({ results }, null, 2) + '\n')
for (const result of results) console.log(`${result.status}: ${result.name}`)
if (results.some(result => result.status !== 'PASS')) process.exit(1)
