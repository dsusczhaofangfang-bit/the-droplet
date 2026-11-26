import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/Flight/particleMotion.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { particleSpeedRatio } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)

test('cruising particles retain a visible speed ratio when the base speed changes', () => {
  assert.ok(particleSpeedRatio(5, 18) > 0)
  assert.ok(particleSpeedRatio(10, 18) > particleSpeedRatio(5, 18))
  assert.equal(particleSpeedRatio(18, 18), 1)
  assert.equal(particleSpeedRatio(0, 18), 0)
  assert.equal(particleSpeedRatio(25, 18), 1)
})
