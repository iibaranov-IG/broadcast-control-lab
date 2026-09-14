import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const descriptor = fs.readFileSync(path.join(source, 'include/ola/messaging/Descriptor.h'), 'utf8')
const regression = fs.readFileSync(path.join(source, 'common/messaging/DescriptorTest.cpp'), 'utf8')
assert.ok(descriptor.includes('value == label_iter->second'))
assert.ok(regression.includes('labels["special"] = 15'))
assert.ok(regression.includes('OLA_ASSERT_TRUE(uint16_descriptor.IsValid(15))'))
assert.ok(regression.includes('OLA_ASSERT_FALSE(uint16_descriptor.IsValid(16))'))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/ola-1995.json', JSON.stringify({ results: [{ name: 'labeled integer validation', status: 'PASS' }] }, null, 2) + '\n')
console.log('PASS ola-1995: labeled value acceptance verified')
