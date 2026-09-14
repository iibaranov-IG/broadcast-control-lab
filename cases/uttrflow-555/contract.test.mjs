import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const source = path.resolve(process.argv[2] ?? '.')
const read = file => readFileSync(path.join(source, file), 'utf8')
const app = read('Sources/Uttrflow/AppDelegate.swift')
const microphone = read('Sources/UttrflowPermissions/MicrophonePermissionGate.swift')
const microphoneSystem = read('Sources/UttrflowPermissions/MicrophonePermissionGate+System.swift')
const accessibilitySystem = read('Sources/UttrflowPermissions/AccessibilityPermissionGate+System.swift')
const onboarding = read('Sources/Uttrflow/Onboarding/OnboardingWindowController.swift')
const openerPath = path.join(source, 'Sources/UttrflowPermissions/SystemSettingsOpener.swift')
let opener = ''
try { opener = readFileSync(openerPath, 'utf8') } catch {}

test('denied microphone recovery reaches its Settings-aware gate', () => {
  assert.match(app, /case \.microphone:\s*_ = await MicrophonePermissionGate\(\)\.requestOrOpenSettings\(\)/s, 'MICROPHONE_RECOVERY_NOT_ROUTED')
  assert.match(microphone, /case \.denied, \.restricted:\s*openSettings\(\)/s, 'MICROPHONE_REFUSAL_DOES_NOT_OPEN_SETTINGS')
  assert.match(microphoneSystem, /openSettings: \{ SystemSettingsOpener\(\)\.open\(\.microphone\) \}/, 'MICROPHONE_SETTINGS_NOT_WIRED')
})

test('an undecided microphone still uses the native request', () => {
  assert.match(microphone, /case \.notDetermined:\s*return await request\(\)/s, 'UNDECIDED_MICROPHONE_DOES_NOT_PROMPT')
})

test('Apple Intelligence recovery opens its own pane', () => {
  assert.match(app, /case \.appleIntelligence:\s*SystemSettingsOpener\(\)\.open\(\.appleIntelligence\)/s, 'APPLE_INTELLIGENCE_RECOVERY_MISROUTED')
})

test('one helper owns all Settings addresses and callers use it', () => {
  for (const address of ['Privacy_Microphone', 'Privacy_Accessibility', 'com.apple.Siri-Settings.extension']) assert.match(opener, new RegExp(address))
  assert.match(onboarding, /SystemSettingsOpener\(\)\.open\(pane\)/)
  assert.match(accessibilitySystem, /SystemSettingsOpener\(\)\.open\(\.accessibility\)/)
  assert.doesNotMatch(onboarding, /x-apple\.systempreferences:/)
  assert.doesNotMatch(accessibilitySystem, /x-apple\.systempreferences:/)
})

test('upstream tests cover refusal, prompt and every pane', () => {
  const gateTests = read('Tests/UttrflowPermissionsTests/MicrophonePermissionGateTests.swift')
  const openerTests = read('Tests/UttrflowPermissionsTests/SystemSettingsOpenerTests.swift')
  assert.match(gateTests, /opensSettingsAfterRefusal/)
  assert.match(gateTests, /recoveryPromptsWhenUndecided/)
  for (const pane of ['microphone', 'accessibility', 'appleIntelligence']) assert.match(openerTests, new RegExp(`\\.${pane}`))
})
