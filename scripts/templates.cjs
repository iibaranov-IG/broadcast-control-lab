function options(args) {
  const result = { language: 'node', protocol: 'none' }
  for (let i = 0; i < args.length; i += 2) {
    if (!['--template', '--protocol'].includes(args[i]) || !args[i + 1]) throw new Error('Use --template cpp|node|python and --protocol tcp|udp|none')
    result[args[i] === '--template' ? 'language' : 'protocol'] = args[i + 1]
  }
  if (!['cpp', 'node', 'python'].includes(result.language) || !['tcp', 'udp', 'none'].includes(result.protocol)) throw new Error('Unknown language or protocol template')
  return result
}
function generate(c, { language = 'node', protocol = 'none' } = {}) {
  options(['--template', language, '--protocol', protocol])
  const base = `cases/${c.id}`, source = c.sources[0].directory
  c.template = { language, protocol }
  c.steps.test = [{ cwd: '.', argv: ['node', `${base}/test.mjs`] }]
  c.steps.build = [{ cwd: source, argv: language === 'cpp' ? ['make'] : language === 'node' ? ['npm', 'run', 'build'] : ['python3', '-m', 'compileall', '-q', '.'] }]
  const files = {}
  const ext = { cpp: 'cpp', python: 'py', node: 'mjs' }[language]
  files[`probe.${ext}`] = language === 'cpp'
    ? '#include <iostream>\n// Call the actual project code. BCL_HOST/BCL_PORT identify the optional stand.\nint main() { std::cerr << "TODO: implement negative control and repair acceptance\\n"; return 1; }\n'
    : language === 'python'
      ? '# Import the actual project code. BCL_HOST/BCL_PORT identify the optional stand.\nraise NotImplementedError("Implement negative control and repair acceptance")\n'
      : '// Import the actual project code. BCL_HOST/BCL_PORT identify the optional stand.\nthrow new Error("Implement negative control and repair acceptance")\n'
  const command = language === 'cpp' ? [`reports/${c.id}/probe`] : [language === 'python' ? 'python3' : 'node', `${base}/probe.${ext}`]
  files['test.mjs'] = `import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
${protocol === 'none' ? '' : "import { createDevice, scenario } from './protocol.mjs'"}
const report = { hardwareVerified: false, applicationVerified: false, results: [] }
mkdirSync(${JSON.stringify(`reports/${c.id}`)}, { recursive: true })
const execute = (argv, env = {}) => new Promise((resolve, reject) => {
  const child = spawn(argv[0], argv.slice(1), { stdio: 'inherit', env: { ...process.env, ...env }, timeout: 10000 })
  child.on('error', reject)
  child.on('exit', code => code === 0 ? resolve() : reject(new Error('Probe exited ' + code)))
})
const started = performance.now()
let device
try {
  ${language === 'cpp' ? `await execute(['c++', '-std=c++17', '-Wall', '-Wextra', ${JSON.stringify(`${base}/probe.cpp`)}, '-o', ${JSON.stringify(`reports/${c.id}/probe`)}])` : ''}
  ${protocol === 'none' ? `await execute(${JSON.stringify(command)})` : `device = createDevice()
  const endpoint = await device.start()
  await Promise.all([scenario(device), execute(${JSON.stringify(command)}, { BCL_HOST: endpoint.host, BCL_PORT: String(endpoint.port) })])`}
  report.results.push({ name: 'Project reproduction and repair acceptance', status: 'PASS' })
} catch (error) {
  report.results.push({ name: 'Project reproduction and repair acceptance', status: 'FAIL', message: error.message })
} finally {
  if (device) { report.transcript = device.report().transcript; await device.stop() }
  report.results[0].durationMs = performance.now() - started
  writeFileSync(${JSON.stringify(c.artifacts.report)}, JSON.stringify(report, null, 2) + '\\n')
}
if (report.results.some(r => r.status !== 'PASS')) process.exitCode = 1
`
  if (protocol === 'udp') files['protocol.mjs'] = `import { ScriptedUdpDevice } from '../../lib/scripted-udp-device.mjs'
export const createDevice = () => new ScriptedUdpDevice()
// Replace these illustrative bytes with an independently justified protocol contract.
export const scenario = device => device.run([
  { expect: Buffer.from('PING'), replies: [{ data: Buffer.from('PONG'), delayMs: 10 }] },
])
`
  if (protocol === 'tcp') files['protocol.mjs'] = `import { ScriptedTcpDevice } from '../../lib/scripted-tcp-device.mjs'
export const createDevice = () => new ScriptedTcpDevice()
// Replace illustrative strings with the actual protocol contract.
export async function scenario(device) {
  await device.waitForConnection()
  await device.waitForData('PING\\r\\n')
  await device.sendChunks(['PO', 'NG\\r\\n'], { delayMs: 10 })
}
`
  files['TEMPLATE.md'] = `# ${language} / ${protocol} starter\n\nThis remains a draft and deliberately fails. Implement probe.${ext} against the actual source, including a baseline negative control and candidate acceptance.\n\nThe ${protocol} protocol example is illustrative, not an OSC/VISCA/SSC profile. Read the project from ${source}; the probe receives BCL_HOST/BCL_PORT for the loopback stand.\n\nDefault build recipe: ${c.steps.build[0].argv.join(' ')}. Adapt it to the project before marking ready. Python compileall checks syntax only. Node dependencies are not automatically installed: the existing audited dependency policy still applies. The Docker runtime already provides Node, Python and the C++ compiler.\n\nFill the passport's ownerCheck, repair and acceptance fields. Configure publication paths separately before generating publishable evidence.\n`
  return files
}
module.exports = { options, generate }
