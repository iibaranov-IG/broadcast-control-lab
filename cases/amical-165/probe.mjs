import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'

const source = resolve(process.argv[2] || 'sources/amical-165')
const workletCode = readFileSync(resolve(source, 'apps/desktop/src/assets/audio-recorder-processor.js'), 'utf8')
const deviceCode = readFileSync(resolve(source, 'apps/desktop/src/hooks/audioCaptureDevice.ts'), 'utf8')
const contextCode = readFileSync(resolve(source, 'apps/desktop/src/hooks/audioCaptureContext.ts'), 'utf8')

let ProcessorClass
class AudioWorkletProcessor {
  constructor() {
    this.port = { postMessage() {}, onmessage: null }
  }
}
const sandbox = {
  AudioWorkletProcessor,
  Float32Array,
  sampleRate: 16000,
  registerProcessor(_name, implementation) {
    ProcessorClass = implementation
  }
}
vm.runInNewContext(workletCode, sandbox, { filename: 'audio-recorder-processor.js' })

const capture = (channels) => {
  const processor = new ProcessorClass()
  const frames = []
  processor.port.postMessage = (message) => frames.push(message)
  processor.process([channels], [], {})
  return frames[0]?.frame
}

const checks = [
  ['channel 2 reaches the mono recorder', () => {
    const microphone = new Float32Array(512).fill(0.25)
    assert.deepEqual(capture([new Float32Array(512), microphone]), microphone)
  }],
  ['the strongest of three channels is preserved without attenuation', () => {
    const microphone = new Float32Array(512).fill(-0.4)
    assert.deepEqual(capture([
      new Float32Array(512).fill(0.001),
      new Float32Array(512).fill(0.1),
      microphone
    ]), microphone)
  }],
  ['mono microphones remain unchanged', () => {
    const microphone = Float32Array.from({ length: 512 }, (_, index) => index / 1024)
    assert.deepEqual(capture([microphone]), microphone)
  }],
  ['capture requests stereo then expands to the device maximum', () => {
    assert.match(deviceCode, /channelCount:\s*\{\s*ideal:\s*2\s*\}/)
    assert.match(deviceCode, /getCapabilities\?\.\(\)\.channelCount\?\.max/)
    assert.match(deviceCode, /applyConstraints\(\{[\s\S]*channelCount:\s*\{\s*ideal:\s*maximumChannelCount\s*\}/)
  }],
  ['the worklet receives discrete channels', () => {
    assert.match(contextCode, /channelCountMode:\s*["']max["']/)
    assert.match(contextCode, /channelInterpretation:\s*["']discrete["']/)
  }]
]

let failed = false
for (const [name, check] of checks) {
  try {
    check()
    console.log(`ok - ${name}`)
  } catch (error) {
    failed = true
    console.error(`not ok - ${name}: ${error.message}`)
  }
}
console.log(`# tests ${checks.length}`)
if (failed) {
  console.error('BUG_MULTICHANNEL_INPUT_DROPPED')
  process.exitCode = 1
}
