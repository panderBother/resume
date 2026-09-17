import { useMemo, useState } from 'react'
import { ArrowUpRight, MousePointer2, Rotate3D, X, ZoomIn } from 'lucide-react'
import SolarSystem from './SolarSystem'
import { profile, sections, skillDetails, skills } from './data'

export default function App() {
  const [entered, setEntered] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [skill, setSkill] = useState<string | null>(null)
  const section = useMemo(() => sections.find((item) => item.id === active), [active])
  const enter = () => { setEntered(true); setActive(null); setSkill(null) }
  const goHome = () => { setEntered(false); setActive(null); setSkill(null) }
  const select = (id: string) => { if (!entered) return; setActive(id); setSkill(null) }
  const closeDetail = () => { setActive(null); setSkill(null) }

  return <main className={entered ? 'universe-mode' : 'landing-mode'} style={{ '--accent': section?.color ?? '#ffb64c' } as React.CSSProperties}>
    <div className="space-noise" />
    <SolarSystem interactive={entered} active={active ?? 'overview'} onSelect={select} onSkill={(name) => entered && setSkill(name)} />

    <header className="topbar">
      <button className="brand" onClick={goHome} aria-label="返回个人网站首页">
        <span className="brand-system"><i /></span>
        <span><b>{profile.englishName}</b><small>PERSONAL SOLAR SYSTEM</small></span>
      </button>
      {!entered && <div className="status"><i /> {profile.status}</div>}
      {entered && <button className="back-home" onClick={goHome}>返回首页</button>}
    </header>

    {!entered && <section className="landing-copy">
      <div className="overline">PORTFOLIO · 2026</div>
      <h1>你好，我是<br/><strong>{profile.name}</strong><sup>✦</sup></h1>
      <p>{profile.intro}</p>
      <button className="enter-button" onClick={enter}>进入我的宇宙 <ArrowUpRight size={17} /></button>
      <div className="landing-contact">
        <a href={`tel:${profile.phone}`}>{profile.phone}</a><i />
        <a href={`mailto:${profile.email}`}>{profile.email}</a><i />
        <a href={profile.github} target="_blank" rel="noreferrer">GitHub · {profile.githubName}</a>
      </div>
      <div className="landing-foot">{profile.location}　·　{profile.intent.toUpperCase()}</div>
    </section>}

    {entered && active === null && !skill && <div className="universe-hint">
      <span><Rotate3D size={15} />拖拽旋转</span>
      <span><ZoomIn size={15} />滚轮缩放</span>
      <span><MousePointer2 size={14} />点击天体</span>
    </div>}

    {entered && active === 'profile' && <aside className="detail-panel profile-panel" aria-live="polite">
      <button className="panel-close" onClick={closeDetail} aria-label="关闭个人简介"><X size={18} /></button>
      <div className="section-code">THE SUN / 太阳</div>
      <h2>个人简介</h2>
      <p className="profile-role">{profile.role}</p>
      <p className="profile-intro">{profile.intro}</p>
      <div className="profile-links">
        <a href={`tel:${profile.phone}`}>{profile.phone}</a>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        <a href={profile.github} target="_blank" rel="noreferrer">GitHub · {profile.githubName}</a>
        <span>博客 · {profile.blog}</span>
      </div>
      <div className="profile-facts"><span>2027 GRADUATE<br/><b>计算机科学与技术</b></span><span>{skills.length} SKILLS<br/><b>全栈能力星图</b></span></div>
    </aside>}

    {entered && section && <aside className="detail-panel" aria-live="polite">
      <button className="panel-close" onClick={closeDetail} aria-label="关闭详情并返回宇宙"><X size={18} /></button>
      <div className="section-code">{section.en} / {section.planet}</div>
      <h2>{section.label}</h2>
      <div className="entry-list">
        {section.entries.map((entry, index) => <article key={`${entry.period}-${entry.role}`}>
          <div className="entry-number">{String(index + 1).padStart(2, '0')}</div>
          <div><time>{entry.period}</time><h3>{entry.role}</h3><h4>{entry.org}</h4><p>{entry.desc}</p>
            {entry.highlights && <ol className="entry-highlights">{entry.highlights.map((item) => <li key={item}>{item}</li>)}</ol>}
            <div className="tags">{entry.tags.map((tag) => <b key={tag}>{tag}</b>)}</div>
          </div>
        </article>)}
      </div>
    </aside>}

    {entered && skill && <div className="skill-card">
      <button onClick={closeDetail} aria-label="关闭技能信息"><X size={15} /></button>
      <small>SKILL SIGNAL</small><h3>{skill}</h3><p>{skillDetails[skill]}</p>
      <i style={{ '--skill': skills.find((item) => item[0] === skill)?.[1] } as React.CSSProperties} />
    </div>}

    {!entered && <a className="texture-credit" href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">PLANET TEXTURES · SOLAR SYSTEM SCOPE / CC BY 4.0</a>}
  </main>
}
