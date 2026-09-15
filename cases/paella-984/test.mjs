import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const source = path.resolve(process.argv[2] ?? 'sources/paella-984');
const moduleDir = path.join(source, 'modules/engage-paella-player-8');
const lock = JSON.parse(readFileSync(path.join(moduleDir, 'package-lock.json')));
const core = lock.packages['node_modules/@asicupv/paella-opencast-core'];
const paellaCore = lock.packages['node_modules/@asicupv/paella-core'];
const testSource = readFileSync(path.join(moduleDir, 'tests/audio-only-manifest.test.mjs'), 'utf8');

const checks = [
  ['fixed Opencast converter is locked', core?.version === '2.0.3'],
  ['compatible Paella core is locked', paellaCore?.version === '2.11.3'],
  ['reported audio/m4a delivery shape is covered', testSource.includes("mimetype: 'audio/m4a'") && testSource.includes("type: 'presentation/delivery'")],
  ['mainAudio manifest contract is asserted', testSource.includes("streams[0].role, 'mainAudio'") && testSource.includes('streams[0].sources.audio')],
];
const results = checks.map(([name, pass]) => ({ name, status: pass ? 'PASS' : 'FAIL' }));
writeFileSync('reports/paella-984.json', `${JSON.stringify({ case: 'paella-984', results }, null, 2)}\n`);
if (results.some((result) => result.status !== 'PASS')) process.exitCode = 1;
