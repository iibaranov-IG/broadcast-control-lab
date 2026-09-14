import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import test from 'node:test'

const source = path.resolve(process.argv[2] ?? 'sources/dualsense-tester-222')
const read = relative => readFile(path.join(source, relative), 'utf8')

test('maps percentage volume through every DualSense playback path', async () => {
  let volume
  try {
    volume = await import(`${pathToFileURL(path.join(source, 'src/utils/dualsense/audioVolume.ts')).href}?bcl=${Date.now()}`)
  }
  catch (error) {
    throw new Error(`DEAD_VOLUME_RANGE: shared percentage conversion is missing (${error.code ?? error.message})`)
  }

  assert.equal(volume.DUALSENSE_AUDIO_VOLUME_MAX.speaker, 0x64)
  assert.equal(volume.DUALSENSE_AUDIO_VOLUME_MAX.headphone, 0x7F)
  assert.equal(volume.audioVolumePercentToDeviceValue('speaker', 0), 0)
  assert.equal(volume.audioVolumePercentToDeviceValue('speaker', 50), 50)
  assert.equal(volume.audioVolumePercentToDeviceValue('speaker', 100), 100)
  assert.equal(volume.audioVolumePercentToDeviceValue('headphone', 50), 64)
  assert.equal(volume.audioVolumePercentToDeviceValue('headphone', 100), 127)
  assert.equal(volume.audioVolumePercentToDeviceValue('speaker', -1), 0)
  assert.equal(volume.audioVolumePercentToDeviceValue('speaker', 255), 100)

  const [player, btPlayer, dualSense, edge, dualSenseOutput, edgeOutput] = await Promise.all([
  read('src/components/common/MediaFilePlayer.vue'),
  read('src/composables/useBtAudioPlayer.ts'),
  read('src/router/DualSense/views/AudioControlWidget.vue'),
  read('src/router/DualSenseEdge/views/AudioControlWidget.vue'),
  read('src/router/DualSense/views/OutputPanel.vue'),
  read('src/router/DualSenseEdge/views/OutputPanel.vue'),
  ])
  assert.match(player, /v-model="audioVolume"[^>]*:max="100"/)
  assert.doesNotMatch(player, /v-model="audioVolume"[^>]*:max="255"/)
  assert.match(btPlayer, /audioVolumePercentToDeviceValue\(target, audioVolume\.value\)/)
  for (const widget of [dualSense, edge]) {
    assert.match(widget, /audioVolumePercentToDeviceValue\(target, audioVolume\.value\)/)
    assert.match(widget, /DUALSENSE_AUDIO_VOLUME_MAX\.speaker/)
    assert.match(widget, /DUALSENSE_AUDIO_VOLUME_MAX\.headphone/)
  }
  for (const output of [dualSenseOutput, edgeOutput]) {
    assert.match(output, /:max="DUALSENSE_AUDIO_VOLUME_MAX\.speaker"/)
    assert.match(output, /:max="DUALSENSE_AUDIO_VOLUME_MAX\.headphone"/)
  }
  console.log('PASS: 0–100 player volume maps to effective DualSense speaker/headphone HID ranges in every playback path')
  if (existsSync('cases/dualsense-tester-222')) {
    mkdirSync('reports/dualsense-tester-222', { recursive: true })
    writeFileSync('reports/dualsense-tester-222.json', `${JSON.stringify({
      hardwareVerified: false,
      applicationVerified: false,
      results: [{ name: 'DualSense audio percentage and HID range acceptance', status: 'PASS' }],
    }, null, 2)}\n`)
  }
})
