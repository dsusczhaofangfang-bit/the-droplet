import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle = await build({ entryPoints: ['src/Flight/FlightMotionField.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { FlightMotionField } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)
globalThis.document = { hidden: false }
test('shared field moves layers continuously and deterministically through turning and deceleration', () => {
  const a = new FlightMotionField(), b = new FlightMotionField()
  const settings = { baseSpeed: 5, maxSpeed: 18, acceleration: 3, deceleration: 4, direction: [-1,0,0], roll: 0, mode: 'high', paused: false, particleSpeed: 1 }
  for (let i = 0; i < 360; i++) { const s = i < 180 ? settings : { ...settings, direction: [0,0,-1], mode: 'cruise' }; a.update(1/60, s); b.update(1/60, s) }
  assert.ok(a.position.length() > 1)
  assert.deepEqual(a.position.toArray(), b.position.toArray())
  assert.ok(a.direction.z < -0.9)
  assert.ok(a.speed > settings.baseSpeed)
})

