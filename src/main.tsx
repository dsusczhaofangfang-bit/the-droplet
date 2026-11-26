import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './style.css'

// 打开或刷新页面时从首页开始，不让浏览器恢复旧章节或项目详情。
window.history.scrollRestoration = 'manual'
function startAtHome() {
  const hadHash = Boolean(window.location.hash)
  if (hadHash) {
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}
startAtHome()
// 浏览器从往返缓存恢复页面时不会重新执行入口模块。
window.addEventListener('pageshow', event => { if (event.persisted) startAtHome() })

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
