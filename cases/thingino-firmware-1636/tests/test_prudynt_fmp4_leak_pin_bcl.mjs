import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

test('firmware ships the fMP4 cleanup revision', () => {
  const source = fs.readFileSync('package/prudynt-t/prudynt-t.mk', 'utf8')
  assert.match(source, /^PRUDYNT_T_VERSION = 354b1b4bde4aa67860021531b85549d88ee1717c$/m)
})
