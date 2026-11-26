import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BootManager } from '../src/Boot/BootManager.ts'

test('boot progress is monotonic and ready only after every real task', () => {
  const manager = new BootManager()
  const tasks = ['application', 'renderer', 'environment', 'reflection', 'droplet', 'motion', 'shaders', 'frame']
  let previous = 0
  for (const [index, task] of tasks.entries()) {
    manager.complete(task)
    const state = manager.getSnapshot()
    assert.ok(state.progress > previous)
    assert.equal(state.ready, index === tasks.length - 1)
    assert.equal(state.progress === 100, state.ready)
    previous = state.progress
    manager.complete(task)
    assert.equal(manager.getSnapshot().progress, previous)
  }
})

test('failure keeps the boot screen blocked and ignores later completions', () => {
  const manager = new BootManager()
  manager.complete('application')
  const original = console.error
  console.error = () => {}
  try { manager.fail(new Error('test failure')) } finally { console.error = original }
  manager.complete('renderer')
  assert.equal(manager.getSnapshot().progress, 5)
  assert.equal(manager.getSnapshot().ready, false)
  assert.equal(manager.getSnapshot().error, 'test failure')
})

test('partial environment updates remain monotonic and cannot claim completion', () => {
  const manager = new BootManager()
  for (const task of ['application', 'renderer', 'reflection', 'droplet', 'motion', 'shaders', 'frame']) manager.complete(task)
  manager.progress('environment', 0.5)
  assert.equal(manager.getSnapshot().progress, 90)
  manager.progress('environment', 0.25)
  assert.equal(manager.getSnapshot().progress, 90)
  manager.progress('environment', 1)
  assert.ok(manager.getSnapshot().progress < 100)
  assert.equal(manager.getSnapshot().ready, false)
  manager.complete('environment')
  assert.equal(manager.getSnapshot().progress, 100)
  assert.equal(manager.getSnapshot().ready, true)
})
