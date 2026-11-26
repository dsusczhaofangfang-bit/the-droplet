import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/Flight/FlightController.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { FlightController, defaultFlightSettings } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)
globalThis.document = { hidden: false }
const run = (controller, seconds, fps, settings) => { for (let i = 0; i < seconds * fps; i++) controller.update(1 / fps, settings) }

test('speed integration stays consistent across frame rates', () => {
  const a = new FlightController(), b = new FlightController()
  run(a, 5, 30, defaultFlightSettings); run(b, 5, 120, defaultFlightSettings)
  assert.ok(Math.abs(a.speed - b.speed) < 0.001)
  assert.ok(Math.abs(a.progress - b.progress) < 0.1)
})

test('pause, visibility, acceleration and turning remain continuous', () => {
  const flight = new FlightController(), cruise = { ...defaultFlightSettings }
  run(flight, 5, 60, cruise)
  const speed = flight.speed, progress = flight.progress
  flight.update(1, { ...cruise, paused: true })
  globalThis.document.hidden = true; flight.update(1, cruise); globalThis.document.hidden = false
  assert.equal(flight.progress, progress)
  flight.update(1 / 60, { ...cruise, mode: 'high', direction: [0, 0, -1] })
  assert.ok(flight.speed > speed && flight.speed - speed < 1)
  assert.equal(flight.state, 'Turn')
  assert.ok(Math.abs(flight.orientation.length() - 1) < 1e-8)
  run(flight, 15, 60, { ...cruise, mode: 'high', direction: [0, 0, -1] })
  assert.ok(flight.direction.z < -0.99)
  assert.ok(flight.displacement.x >= 0 && flight.displacement.x < 80)
  const high = flight.speed
  flight.update(1 / 60, cruise)
  assert.ok(flight.speed < high && flight.speed > speed)
})
