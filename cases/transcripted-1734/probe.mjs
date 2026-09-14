import { readFileSync } from 'node:fs'
import path from 'node:path'
const root = path.resolve(process.argv[2] || process.argv[1] || '.')
const policy = readFileSync(path.join(root, 'Sources/Speech/DictationInputDeviceSelectionPolicy.swift'), 'utf8')
const engine = readFileSync(path.join(root, 'Sources/Speech/ParakeetEngine.swift'), 'utf8')
const tests = readFileSync(path.join(root, 'Tests/DictationInputDeviceSelectionPolicyTests.swift'), 'utf8')
const apply = policy.match(/static func apply\([\s\S]*?\n    }\n\n    static func verify/)?.[0] || ''
const bindBlock = apply.match(/if needsBinding \{[\s\S]*?\n        }/)?.[0] || ''
const settleStart = engine.indexOf('guard snapshot.selectionApplication?.didApplyOverride == true')
const settleSleep = engine.indexOf('Task.sleep(nanoseconds: TranscriptedConstants.audioRecoveryDelay)', settleStart)
const settledVerify = engine.indexOf('try DictationInputDeviceBindingPolicy.verify(', settleSleep)
const checks = {
  'selected ID is validated before a native route write': /guard selectedID != 0[\s\S]*?throw DictationInputDeviceBindingError\.selectedDeviceNotBound/.test(apply),
  'a successful changed binding returns to the settle phase': /try setDeviceID\(selectedID\)[\s\S]*?return true/.test(bindBlock),
  'the binding block does not demand an immediate device ID read': !/currentDeviceID\(\)|\bverify\(/.test(bindBlock),
  'unchanged bindings remain verified synchronously': /if needsBinding[\s\S]*?return true[\s\S]*?try verify\(selectedDeviceID: selectedID, boundDeviceID: currentDeviceID\(\)\)[\s\S]*?return false/.test(apply),
  'production waits before strict physical binding verification': settleStart >= 0 && settleSleep > settleStart && settledVerify > settleSleep,
  'focused regression names the reported C920': tests.includes('Logitech HD Pro Webcam C920'),
  'focused regression covers asynchronous route settling': tests.includes('allows an asynchronous USB route to settle') && tests.includes('a USB route that never settles must remain unavailable')
}
for (const [name, ok] of Object.entries(checks)) console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`)
console.log(`Ran ${Object.keys(checks).length} tests`)
if (!Object.values(checks).every(Boolean)) {
  console.log('BUG_ASYNC_USB_BINDING_REJECTED')
  process.exit(1)
}
console.log('PASS: asynchronous USB binding reaches strict settled verification')
