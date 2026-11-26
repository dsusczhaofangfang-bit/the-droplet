import { useEffect, useState } from 'react'

// 同一滚动进度驱动摄像机和内容层，章节起点对应五个镜头关键帧。
export function useNarrative(setCameraProgress: (progress: number) => void) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'))
        if (sections.length < 2) return
        const y = window.scrollY
        let index = 0
        while (index < sections.length - 2 && y >= sections[index + 1].offsetTop) index++
        const start = sections[index].offsetTop
        const end = sections[index + 1].offsetTop
        const value = Math.min(1, Math.max(0, (index + Math.min(1, Math.max(0, (y - start) / (end - start)))) / (sections.length - 1)))
        setProgress(value)
        setCameraProgress(value)
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [setCameraProgress])
  return progress
}
