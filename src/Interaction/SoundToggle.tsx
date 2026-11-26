import { useEffect, useRef, useState } from 'react'

// 声音仅在用户手势后创建；页面隐藏时暂停，关闭时释放音频资源。
export function SoundToggle({ language }: { language: 'zh' | 'en' }) {
  const [enabled, setEnabled] = useState(false)
  const [failed, setFailed] = useState(false)
  const audio = useRef<AudioContext | null>(null)
  useEffect(() => {
    const visibility = () => { const context = audio.current; if (context) { if (document.hidden) void context.suspend(); else void context.resume().catch(() => setFailed(true)) } }
    document.addEventListener('visibilitychange', visibility)
    return () => { document.removeEventListener('visibilitychange', visibility); if (audio.current) void audio.current.close() }
  }, [])
  const toggle = async () => {
    if (audio.current) { const context = audio.current; audio.current = null; setEnabled(false); await context.close(); return }
    try {
      const context = new AudioContext()
      audio.current = context
      const gain = context.createGain()
      gain.gain.setValueAtTime(0, context.currentTime)
      gain.gain.linearRampToValueAtTime(0.025, context.currentTime + 2)
      gain.connect(context.destination)
      for (const frequency of [55, 82.41]) { const oscillator = context.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; oscillator.connect(gain); oscillator.start() }
      await context.resume(); setFailed(false); setEnabled(true)
    } catch { if (audio.current) void audio.current.close(); audio.current = null; setEnabled(false); setFailed(true) }
  }
  const label = language === 'zh' ? (enabled ? '关闭环境音' : '开启环境音') : (enabled ? 'Turn ambient sound off' : 'Turn ambient sound on')
  return <span className="sound-control"><button className="sound-toggle" type="button" onClick={() => void toggle()} aria-pressed={enabled} aria-label={label}>{language === 'zh' ? `声音 ${enabled ? '开' : '关'}` : `SOUND ${enabled ? 'ON' : 'OFF'}`}</button>{failed && <span role="status">{language === 'zh' ? '音频不可用' : 'Audio unavailable'}</span>}</span>
}
