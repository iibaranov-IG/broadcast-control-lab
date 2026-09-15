import { existsSync, readFileSync } from 'node:fs'

const read = path => readFileSync(path, 'utf8')
const dispatcher = read('Sources/LogicProMCP/Dispatchers/MixerDispatcher.swift')
const osc = read('Sources/LogicProMCP/Channels/OSCChannel.swift')
const accessibility = read('Sources/LogicProMCP/Channels/AccessibilityChannel.swift')
const elements = read('Sources/LogicProMCP/Accessibility/AXLogicProElements.swift')
const router = read('Sources/LogicProMCP/Channels/ChannelRouter.swift')
const testPath = 'Tests/LogicProMCPTests/MixerDispatcherTests.swift'
const tests = existsSync(testPath) ? read(testPath) : ''

const checks = [
  ['volume dispatcher keeps track/value', /operation: "mixer\.set_volume",\s*params: \["track": String\(track\), "value": String\(value\)\]/s.test(dispatcher)],
  ['pan dispatcher keeps track/value', /operation: "mixer\.set_pan",\s*params: \["track": String\(track\), "value": String\(value\)\]/s.test(dispatcher)],
  ['OSC volume and pan consume value', (osc.match(/params\["value"\]/g) || []).length >= 2],
  ['Accessibility track mutation consumes track/value', accessibility.includes('params["track"]') && accessibility.includes('params["value"]')],
  ['master dispatcher sends value', /operation: "mixer\.set_master_volume",\s*params: \["value": String\(value\)\]/s.test(dispatcher)],
  ['master routes only through implemented Accessibility backend', /"mixer\.set_master_volume":\s*\[\.accessibility\]/.test(router) && accessibility.includes('case "mixer.set_master_volume"')],
  ['master fader matches exact Master before exact Stereo Out', elements.includes('indices(matching: "Master") + indices(matching: "Stereo Out")') && elements.includes('localizedCaseInsensitiveCompare(expectedDescription) == .orderedSame') && elements.includes('for index in masterStripCandidateIndices')],
  ['similarly named buses are excluded from master candidates', tests.includes('descriptions: ["Master Bus", " stereo out\\n", "MASTER"]') && tests.includes('[2, 1]')],
  ['master reports failed Accessibility writes', accessibility.includes('guard AXHelpers.setAttribute(slider') && accessibility.includes('Failed to set master volume control')],
  ['focused Swift regressions cover all reported commands', tests.includes('testVolumeUsesTheAdvertisedParameterContract') && tests.includes('testPanUsesTheAdvertisedParameterContract') && tests.includes('testMasterVolumeRoutesThroughAccessibilityWithValue')],
  ['malformed mixer values stop before routing', tests.includes('testMalformedMixerValuesAreRejectedBeforeRouting') && dispatcher.includes('InputValidation.double') && dispatcher.includes('InputValidation.int')],
]

for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'}: ${name}`)
if (checks.some(([, pass]) => !pass)) {
  console.error('MIXER_PARAMETER_CONTRACT_BROKEN')
  process.exitCode = 1
} else {
  console.log('PASS: mixer parameter contract is aligned end to end')
  console.log(`# tests ${checks.length}`)
  console.log('# skipped 0')
}
