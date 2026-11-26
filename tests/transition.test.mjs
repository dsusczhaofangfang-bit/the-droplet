import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultTransitionSettings as settings, sampleTransition } from '../src/Transition/DropletFlickerController.ts'

test('the handoff holds, flickers, and reveals scene before the interface', () => {
  const start = sampleTransition(0, settings)
  assert.equal(start.iconOpacity, 1)
  assert.equal(start.mainSceneOpacity, 0)
  assert.equal(start.uiVisibility, 0)
  assert.ok(sampleTransition(485, settings).flicker.intensity > 0)
  const flickerEnd = sampleTransition(1050, settings)
  assert.equal(flickerEnd.flicker.intensity, 0)
  const handoff = sampleTransition(1400, settings)
  assert.ok(handoff.iconOpacity < 1)
  assert.ok(handoff.mainSceneOpacity > 0)
  assert.equal(handoff.uiVisibility, 0)
  const finish = sampleTransition(3000, settings)
  assert.equal(finish.iconOpacity, 0)
  assert.equal(finish.mainSceneOpacity, 1)
  assert.equal(finish.particleVisibility, 1)
  assert.equal(finish.uiVisibility, 1)
  assert.equal(finish.done, true)
})

test('visual reveal remains monotonic and never makes the overlay darker again', () => {
  let scene = 0, ui = 0
  for (let time = 0; time <= 3000; time += 10) {
    const state = sampleTransition(time, settings)
    assert.ok(state.mainSceneOpacity >= scene && state.uiVisibility >= ui)
    assert.equal(state.mainSceneOpacity, state.particleVisibility)
    scene = state.mainSceneOpacity; ui = state.uiVisibility
  }
})
