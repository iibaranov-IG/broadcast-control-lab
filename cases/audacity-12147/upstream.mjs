import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = file => readFileSync(file, 'utf8')
const ui = read('src/playback/internal/playbackuiactions.cpp')
const controller = read('src/playback/internal/playbackcontroller.cpp')
const header = read('src/playback/internal/playbackcontroller.h')
const shortcuts = read('src/app/configs/data/shortcuts.xml')
const tests = read('src/playback/tests/playbackcontroller_tests.cpp')

const codes = ['seek-left-short', 'seek-right-short', 'seek-left-long', 'seek-right-long']
if (codes.some(code => !ui.includes(`("${code}")`))) {
  console.error('BUG_SEEK_ACTIONS_UNREGISTERED')
  process.exit(1)
}

const checks = [
  ['all four seek commands are visible and retain default shortcuts', () => {
    for (const code of codes) {
      const symbol = `${code.replaceAll('-', '_').toUpperCase()}_CODE`
      assert.match(ui, new RegExp(`UiAction\\(${symbol}`))
      assert.match(shortcuts, new RegExp(`<key>${code}</key>`))
    }
    assert.match(shortcuts, /<key>seek-left-short<\/key>\s*<seq>Left<\/seq>/)
    assert.match(shortcuts, /<key>seek-right-long<\/key>\s*<seq>Shift\+Right<\/seq>/)
  }],
  ['dispatcher uses configured short and long periods in both directions', () => {
    for (const code of ['SEEK_LEFT_SHORT_CODE', 'SEEK_RIGHT_SHORT_CODE', 'SEEK_LEFT_LONG_CODE', 'SEEK_RIGHT_LONG_CODE']) {
      assert.match(controller, new RegExp(`dispatcher\\(\\)->reg\\(this, ${code}`))
    }
    assert.match(controller, /seekBy\(-playbackConfiguration\(\)->shortSkip\(\)\)/)
    assert.match(controller, /seekBy\(playbackConfiguration\(\)->longSkip\(\)\)/)
  }],
  ['relative seeking moves the active stream and clamps project boundaries', () => {
    assert.match(header, /void seekBy\(muse::secs_t delta\);/)
    assert.match(controller, /std::clamp\(playbackPosition\(\) \+ delta, muse::secs_t\(0\.0\), totalPlayTime\(\)\)/)
    assert.match(controller, /doSeek\(target, isPlaying\(\)\);/)
    assert.match(tests, /SeekBy_WhilePlayingMovesTheActiveStream/)
    assert.match(tests, /seek\(secs_t\(15\.0\), true\)/)
    assert.match(tests, /SeekBy_ClampsToProjectBounds/)
  }],
  ['seek shortcuts cannot replace stopped cursor movement or alter recording', () => {
    assert.match(controller, /if \(isStopped\(\) \|\| recordController\(\)->isRecording\(\)\)/)
    assert.match(controller, /return !isStopped\(\) && !recordController\(\)->isRecording\(\);/)
    assert.match(tests, /SeekBy_WhenStoppedDoesNothing/)
    assert.match(tests, /SeekShortcutsAreEnabledOnlyForActivePlayback/)
  }],
]

console.log('TAP version 13')
for (const [index, [name, check]] of checks.entries()) {
  try { check(); console.log(`ok ${index + 1} - ${name}`) }
  catch (error) { console.log(`not ok ${index + 1} - ${name}`); console.error(error.message); process.exitCode = 1 }
}
console.log(`1..${checks.length}`)
console.log(`# tests ${checks.length}`)
