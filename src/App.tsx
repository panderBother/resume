import { useMemo, useState } from 'react'
import { Minus, MousePointer2, Plus, Rotate3D, X } from 'lucide-react'
import SolarSystem from './SolarSystem'
import { profile, sections, skills } from './data'

export default function App() {
  const [active, setActive] = useState('profile')
  const [skill, setSkill] = useState<string | null>(null)
  const section = useMemo(() => sections.find((item) => item.id === active), [active])
  const select = (id: string) => { setActive(id); setSkill(null) }

  return <main style={{ '--accent': section?.color ?? '#ffb64c' } as React.CSSProperties}>
    <div className="space-noise" />
    <SolarSystem active={active} onSelect={select} onSkill={setSkill} />

    <header className="topbar">
      <button className="brand" onClick={() => select('profile')} aria-label="返回太阳系总览">
        <span className="brand-system"><i /></span>
        <span><b>{profile.englishName}</b><small>PERSONAL SOLAR SYSTEM</small></span>
      </button>
      <div className="status"><i /> OPEN TO WORK</div>
    </header>

    <section className={`identity ${active === 'profile' ? '' : 'minimized'}`}>
      <div className="overline">THE SUN · 个人简介</div>
      <h1>{profile.name}<span> / {profile.role}</span></h1>
      <p>{profile.intro}</p>
    </section>

    <div className="controls-hint">
      <span><Rotate3D size={16} />拖拽旋转</span>
      <span><MousePointer2 size={15} />点击聚焦</span>
      <span><Minus size={13} /><Plus size={13} />滚轮缩放</span>
    </div>
    <a className="texture-credit" href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">PLANET TEXTURES · SOLAR SYSTEM SCOPE / CC BY 4.0</a>

    {section && <aside className="detail-panel" aria-live="polite">
      <button className="panel-close" onClick={() => select('profile')} aria-label="关闭详情并返回总览"><X size={18} /></button>
      <div className="section-code">{section.en} / {section.planet}</div>
      <h2>{section.label}</h2>
      <p className="section-summary">{section.id === 'education'
        ? `${section.entries.length} 段教育经历。教育行星保持简洁，不设置卫星。`
        : `${section.entries.length} 颗卫星，分别对应 ${section.entries.length} 段${section.label}。`}</p>
      <div className="entry-list">
        {section.entries.map((entry, index) => <article key={`${entry.period}-${entry.role}`}>
          <div className="entry-number">{String(index + 1).padStart(2, '0')}</div>
          <div>
            <time>{entry.period}</time>
            <h3>{entry.role}</h3>
            <h4>{entry.org}</h4>
            <p>{entry.desc}</p>
            <div className="tags">{entry.tags.map((tag) => <b key={tag}>{tag}</b>)}</div>
          </div>
        </article>)}
      </div>
    </aside>}

    <nav className="planet-nav" aria-label="太阳系内容导航">
      <button className={active === 'profile' ? 'active' : ''} onClick={() => select('profile')} title="太阳 · 个人简介"><i style={{ '--planet': '#ffb64c' } as React.CSSProperties} /><span>太阳</span></button>
      {sections.map((item) => <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => select(item.id)} title={`${item.planet} · ${item.label}`}><i style={{ '--planet': item.color } as React.CSSProperties} /><span>{item.label}</span></button>)}
    </nav>

    {skill && <div className="skill-card">
      <button onClick={() => setSkill(null)} aria-label="关闭技能信息"><X size={15} /></button>
      <small>SKILL SIGNAL</small><h3>{skill}</h3><p>这颗远方光点代表能力图谱中的一项技能。</p>
      <i style={{ '--skill': skills.find((item) => item[0] === skill)?.[1] } as React.CSSProperties} />
    </div>}
  </main>
}
