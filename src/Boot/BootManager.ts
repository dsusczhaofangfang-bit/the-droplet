export type BootTask = 'application' | 'renderer' | 'environment' | 'reflection' | 'droplet' | 'motion' | 'shaders' | 'frame'
const weights: Record<BootTask, number> = { application: 5, renderer: 10, environment: 20, reflection: 20, droplet: 10, motion: 5, shaders: 15, frame: 15 }
const labels: Record<BootTask, string> = { application: 'INITIALIZING', renderer: 'INITIALIZING RENDERER', environment: 'LOADING ENVIRONMENT', reflection: 'PREPARING REFLECTIONS', droplet: 'PREPARING DROPLET', motion: 'INITIALIZING MOTION', shaders: 'COMPILING SHADERS', frame: 'RENDERING SCENE' }
export interface BootSnapshot { progress: number; status: string; ready: boolean; error: string | null }
export class BootManager {
  private completed = new Set<BootTask>()
  private partial = new Map<BootTask, number>()
  private listeners = new Set<() => void>()
  private started = performance.now()
  private marks: Partial<Record<BootTask, number>> = {}
  private snapshot: BootSnapshot = { progress: 0, status: 'INITIALIZING', ready: false, error: null }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  progress(task: BootTask, fraction: number) {
    if (this.completed.has(task) || this.snapshot.error) return
    const value = Math.max(this.partial.get(task) ?? 0, Math.min(0.999, Math.max(0, fraction)))
    this.partial.set(task, value)
    this.update()
  }
  private update() {
    const progress = [...this.completed].reduce((sum, key) => sum + weights[key], 0) + [...this.partial].reduce((sum, [key, fraction]) => sum + (this.completed.has(key) ? 0 : weights[key] * fraction), 0)
    const next = (Object.keys(weights) as BootTask[]).find(key => !this.completed.has(key))
    this.snapshot = { progress, status: next ? labels[next] : 'READY', ready: !next, error: null }
    this.listeners.forEach(listener => listener())
  }
  complete(task: BootTask) {
    if (this.completed.has(task) || this.snapshot.error) return
    this.completed.add(task)
    this.marks[task] = performance.now() - this.started
    this.partial.delete(task)
    this.update()
    if (this.snapshot.ready) console.info('[Boot] 各任务完成时间（相对启动，毫秒）', this.marks)
  }
  fail(error: unknown) {
    if (this.snapshot.error) return
    console.error('[Boot] 场景初始化失败:', error)
    this.snapshot = { ...this.snapshot, ready: false, status: 'INITIALIZATION FAILED', error: error instanceof Error ? error.message : String(error) }
    this.listeners.forEach(listener => listener())
  }
}
