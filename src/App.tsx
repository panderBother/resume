import { useMemo, useState } from 'react'
import { ArrowUpRight, ChevronRight, CircleDot, MapPin, MousePointer2, X } from 'lucide-react'
import SolarSystem from './SolarSystem'
import { profile, sections, skills } from './data'

export default function App(){
  const [active,setActive]=useState('profile'); const [skill,setSkill]=useState<string|null>(null)
  const section=useMemo(()=>sections.find(s=>s.id===active),[active])
  const select=(id:string)=>{setActive(id);setSkill(null)}
  const color=section?.color ?? '#ffb64c'
  return <main style={{'--accent':color} as React.CSSProperties}>
    <div className="noise" />
    <header>
      <button className="brand" onClick={()=>select('profile')} aria-label="返回个人简介"><span className="brand-orbit"><i/></span><b>{profile.englishName}</b><em>/ PERSONAL UNIVERSE</em></button>
      <div className="availability"><span/> {profile.status}</div>
    </header>

    <section className="scene-wrap">
      <SolarSystem active={active} onSelect={select} onSkill={setSkill}/>
      <div className="axis axis-x"/><div className="axis axis-y"/>
      <div className="coordinate">RA 05H 14M 32S<br/>DEC +22° 32′</div>
      <div className="drag-hint"><MousePointer2 size={14}/> 拖拽旋转 · 点击天体探索</div>
    </section>

    <aside className="story-panel">
      <div className="eyebrow"><span>0{active==='profile'?1:sections.findIndex(s=>s.id===active)+2}</span><i/>{section?.en ?? 'THE SUN'}</div>
      {active==='profile' ? <>
        <h1>你好，我是<br/><strong>{profile.name}</strong><sup>✦</sup></h1>
        <p className="lead">{profile.intro}</p>
        <div className="profile-meta"><span><MapPin size={14}/>{profile.location}</span><span><CircleDot size={14}/>6 YEARS BUILDING</span></div>
        <button className="primary" onClick={()=>select('projects')}>进入我的宇宙 <ArrowUpRight size={17}/></button>
      </> : <>
        <div className="planet-title"><span className="planet-mini"/><div><small>{section?.planet}</small><h2>{section?.label}</h2></div></div>
        <p className="lead">这颗行星记录了 {section?.entries.length} 段{section?.label}。{section?.id==='education'?'教育经历保持为单一行星，不设置卫星。':'围绕它运行的每颗卫星，都对应一段具体经历。'}</p>
        <div className="entries">
          {section?.entries.map((e,i)=><article key={e.period}>
            <div className="entry-top"><span>0{i+1}</span><time>{e.period}</time></div>
            <h3>{e.role}</h3><h4>{e.org}</h4><p>{e.desc}</p>
            <div className="tags">{e.tags.map(t=><b key={t}>{t}</b>)}</div>
          </article>)}
        </div>
      </>}
    </aside>

    <nav className="orbit-nav" aria-label="个人经历导航">
      <button className={active==='profile'?'active':''} onClick={()=>select('profile')}><span style={{'--c':'#ffb64c'} as React.CSSProperties}/><em>太阳</em><b>个人简介</b></button>
      {sections.map(s=><button key={s.id} className={active===s.id?'active':''} onClick={()=>select(s.id)}><span style={{'--c':s.color} as React.CSSProperties}/><em>{s.planet}</em><b>{s.label}</b><small>{s.id==='education'?'—':String(s.entries.length).padStart(2,'0')}</small></button>)}
    </nav>

    <div className="skill-index"><span>SKILL CONSTELLATION</span><div>{skills.slice(0,6).map(([n,c])=><button key={n} onClick={()=>setSkill(n)} style={{'--s':c} as React.CSSProperties}>{n}</button>)}</div></div>
    {skill&&<div className="skill-pop"><button onClick={()=>setSkill(null)} aria-label="关闭"><X size={16}/></button><span>SKILL SIGNAL</span><h3>{skill}</h3><p>技能光点独立分布在行星轨道之外，代表构成我能力图谱的技术与工具。</p><i style={{'--skill':skills.find(s=>s[0]===skill)?.[1]} as React.CSSProperties}/></div>}
    <footer><span>SCROLL THE ORBIT</span><ChevronRight size={14}/><span>© 2026 XINGYE</span></footer>
  </main>
}
