import { SoundToggle } from '../Interaction/SoundToggle'
import { useEffect, useState, type CSSProperties } from 'react'
import { contact, profile, projects } from '../data/portfolio'

export function SceneFallback() {
  return <div className="fallback" role="alert">无法启动三维场景。请检查浏览器是否支持 WebGL。</div>
}

type Language = 'zh' | 'en'
const copy = {
  zh: { nav: ['首页', '关于', '作品', '思考', '联系'], skip: '跳至正文', language: 'English', name: '探索，从这里开始。', identity: '身份待填写', intro: '在这里，记录你的经历、作品与思考。', scroll: '向下探索', about: '关于我', aboutLead: '每一次观察，都是新的理解。', education: '教育背景', skills: '技术能力', experience: '关注方向', pending: '内容待填写', work: '作品', workLead: '从想法，到真实的创造。', empty: '项目内容尚未添加。', emptyHint: '项目资料将在这里呈现。', thoughts: '思考', thoughtsLead: '留下问题，也留下继续探索的空间。', reading: '人工智能', reflection: '电子与智能硬件', contact: '保持联系', contactLead: '下一段旅程，\n仍在展开。', future: '未来方向', email: '联系方式待填写', back: '返回作品', stack: '技术栈', repository: '查看 GitHub 项目', wechat: '微信', missing: '没有找到这个项目。', detail: '查看项目详情', home: '返回首页' },
  en: { nav: ['Home', 'About', 'Work', 'Thoughts', 'Contact'], skip: 'Skip to content', language: '中文', name: 'Exploration starts here.', identity: 'Identity to be added', intro: 'A place for your experience, work and ideas.', scroll: 'Scroll to explore', about: 'About', aboutLead: 'Every observation opens a new perspective.', education: 'Education', skills: 'Capabilities', experience: 'Focus', pending: 'To be added', work: 'Selected work', workLead: 'From an idea to something real.', empty: 'No projects have been added yet.', emptyHint: 'Project details will appear here.', thoughts: 'Thoughts', thoughtsLead: 'Room for questions, and for what comes next.', reading: 'Artificial intelligence', reflection: 'Electronics & hardware', contact: 'Get in touch', contactLead: 'The next journey\nis still unfolding.', future: 'Future directions', email: 'Contact details to be added', back: 'Back to work', stack: 'Technologies', repository: 'View project on GitHub', wechat: 'WeChat', missing: 'This project could not be found.', detail: 'View project', home: 'Back to home' },
}
const ids = ['encounter', 'structure', 'creation', 'reflection', 'infinity']
const names = ['Encounter', 'Structure', 'Creation', 'Reflection', 'Infinity']

export function Portfolio({ progress }: { progress: number }) {
  const [lang, setLang] = useState<Language>('zh')
  const [hash, setHash] = useState(window.location.hash)
  const t = copy[lang]
  const person = profile[lang]
  const selectedProjects = projects[lang]
  useEffect(() => { const update = () => setHash(window.location.hash); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update) }, [])
  useEffect(() => { document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en' }, [lang])
  useEffect(() => {
    // 项目详情退出后，章节节点重新挂载，再恢复目标位置。
    const id = hash.slice(1)
    if (!ids.includes(id)) return
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
    return () => cancelAnimationFrame(frame)
  }, [hash])
  let projectId: string | null = null
  if (hash.startsWith('#project/')) {
    try { projectId = decodeURIComponent(hash.slice(9)) } catch { projectId = '' }
  }
  const project = selectedProjects.find(item => item.id === projectId)
  const active = Math.min(4, Math.round(progress * 4))
  const chapterStyle = (index: number): CSSProperties => {
    const distance = Math.abs(progress * 4 - index)
    return { '--reveal': Math.max(0.55, 1 - distance * 0.45), '--shift': `${Math.min(18, distance * 12)}px` } as CSSProperties
  }
  if (projectId !== null) return <main className="detail-page" id="content"><a className="text-link" href="#creation">← {t.back}</a>{project ? <article><p className="detail-index">PROJECT / {project.id}</p><h1>{project.title}</h1><p className="detail-summary">{project.summary}</p><div className="detail-body"><h2>{t.stack}</h2><p>{project.stack.join(' / ') || t.pending}</p><p>{project.detail || t.pending}</p>{project.url && <a className="text-link" href={project.url} target="_blank" rel="noopener noreferrer">{t.repository}</a>}</div></article> : <article><h1>{t.missing}</h1><a className="text-link" href="#encounter">{t.home}</a></article>}</main>
  return <>
    <a className="skip-link" href="#content">{t.skip}</a>
    <header className="site-header"><a className="wordmark" href="#encounter" aria-label="The Droplet — home">THE DROPLET<span> / PORTFOLIO</span></a><div className="header-controls"><SoundToggle language={lang} /><button className="language" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} aria-label={lang === 'zh' ? 'Switch to English' : '切换为中文'}>{t.language}</button></div></header>
    <div className="chapter-progress" role="progressbar" aria-label={lang === 'zh' ? '章节进度' : 'Chapter progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><span style={{ transform: `scaleX(${progress})` }} /></div><nav className="chapter-nav" aria-label={lang === 'zh' ? '章节导航' : 'Chapter navigation'}>{ids.map((id, i) => <a href={`#${id}`} key={id} aria-current={active === i ? 'location' : undefined}><span className="nav-number">0{i + 1}</span><span className="nav-name">{t.nav[i]}</span></a>)}</nav>
    <main id="content" className="portfolio">
      <section id="encounter" data-chapter className="chapter encounter" style={chapterStyle(0)}><div className="chapter-content hero-content"><p className="hero-identity">{person.identity || t.identity}</p><h1>{person.name || t.name}</h1><p className="hero-intro">{person.introduction || t.intro}</p><a className="scroll-link" href="#structure"><span>{t.scroll}</span><span aria-hidden="true">↓</span></a></div><p className="chapter-caption">01 / {names[0]}</p></section>
      <section id="structure" data-chapter className="chapter structure" style={chapterStyle(1)}><div className="chapter-content"><h2>{t.about}</h2><p className="section-lead">{t.aboutLead}</p><dl className="facts">{[[t.education, person.education], [t.skills, person.skills], [t.experience, person.experience]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || t.pending}</dd></div>)}</dl></div><p className="chapter-caption">02 / {names[1]}</p></section>
      <section id="creation" data-chapter className="chapter creation" style={chapterStyle(2)}><div className="chapter-content"><h2>{t.work}</h2><p className="section-lead">{t.workLead}</p><div className="project-list">{selectedProjects.length ? selectedProjects.map((item, i) => <a className="project-row" href={`#project/${encodeURIComponent(item.id)}`} key={item.id}><span>0{i + 1}</span><div><h3>{item.title}</h3><p>{item.summary}</p><small>{item.stack.join(' / ')}</small></div><span aria-label={t.detail}>↗</span></a>) : <div className="empty-projects"><p>{t.empty}</p><span>{t.emptyHint}</span></div>}</div></div><p className="chapter-caption">03 / {names[2]}</p></section>
      <section id="reflection" data-chapter className="chapter reflection" style={chapterStyle(3)}><div className="chapter-content"><h2>{t.thoughts}</h2><p className="section-lead">{t.thoughtsLead}</p><dl className="facts">{[[t.reading, person.reading], [t.reflection, person.reflection]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || t.pending}</dd></div>)}</dl></div><p className="chapter-caption">04 / {names[3]}</p></section>
      <section id="infinity" data-chapter className="chapter infinity" style={chapterStyle(4)}><div className="chapter-content"><h2>{t.contact}</h2><p className="closing-line">{t.contactLead}</p><div className="contact-block"><span>{t.future}</span><p>{person.future || t.pending}</p><div className="contact-methods"><p>{t.wechat}：{contact.wechat}</p>{contact.emails.map(email => <a className="text-link" href={`mailto:${email}`} key={email}>{email}</a>)}</div></div></div><p className="chapter-caption">05 / {names[4]}</p></section>
    </main><footer className="site-footer"><span>THE DROPLET</span><span>AN EXPLORATION IN FIVE ACTS</span></footer>
  </>
}
