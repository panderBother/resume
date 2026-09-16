import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { sections, skills } from './data'

type Props = { active: string; onSelect: (id: string) => void; onSkill: (name: string) => void }

function glowTexture(color = '#ffffff') {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const x = c.getContext('2d')!; const g = x.createRadialGradient(64,64,0,64,64,64)
  g.addColorStop(0, color); g.addColorStop(.12, color); g.addColorStop(.4, color + '66'); g.addColorStop(1, 'transparent')
  x.fillStyle = g; x.fillRect(0,0,128,128); return new THREE.CanvasTexture(c)
}

function makeLabel(text: string, color: string) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96
  const x = c.getContext('2d')!; x.font = '600 25px Arial'; x.textAlign='center'; x.textBaseline='middle'
  x.shadowBlur=14; x.shadowColor=color; x.fillStyle='#f7f4ec'; x.fillText(text,256,47)
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c), transparent:true, depthTest:false }))
  s.scale.set(2.8,.53,1); s.position.y=.78; return s
}

export default function SolarSystem({ active, onSelect, onSkill }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  const callbacks = useRef({ onSelect, onSkill }); callbacks.current={onSelect,onSkill}
  useEffect(() => {
    if (!host.current) return
    const el=host.current, scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(42, el.clientWidth/el.clientHeight,.1,160)
    camera.position.set(0,10.8,18); camera.lookAt(0,0,0)
    const renderer=new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)); renderer.setSize(el.clientWidth,el.clientHeight)
    renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15
    el.appendChild(renderer.domElement)
    scene.add(new THREE.AmbientLight(0x7990b8,.32)); const sunLight=new THREE.PointLight(0xffc56e,54,48); scene.add(sunLight)

    const clickable:THREE.Object3D[]=[]; const orbiters:{pivot:THREE.Group; speed:number; planet:THREE.Mesh; base:number}[]=[]
    const sunMat=new THREE.MeshBasicMaterial({color:0xffa52f}); const sun=new THREE.Mesh(new THREE.SphereGeometry(1.18,64,64),sunMat)
    sun.userData={kind:'section',id:'profile'}; scene.add(sun); clickable.push(sun)
    const corona=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture('#ffad38'),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}))
    corona.scale.set(6.2,6.2,1); scene.add(corona)
    const ringMat=new THREE.MeshBasicMaterial({color:0xffd28a,transparent:true,opacity:.1,side:THREE.DoubleSide})
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.4,1.75,96),ringMat); ring.rotation.x=-Math.PI/2; scene.add(ring)
    sun.add(makeLabel('太阳 · 个人简介','#ffb64c'))

    sections.forEach((s,idx)=>{
      const curve=new THREE.EllipseCurve(0,0,s.radius,s.radius*.72,0,Math.PI*2)
      const points=curve.getPoints(160).map(p=>new THREE.Vector3(p.x,0,p.y))
      const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x5e6c83,transparent:true,opacity:.18}))
      scene.add(line)
      const pivot=new THREE.Group(); pivot.rotation.y=s.start; scene.add(pivot)
      const group=new THREE.Group(); group.position.set(s.radius,0,0); pivot.add(group)
      const mat=new THREE.MeshStandardMaterial({color:s.color,roughness:.72,metalness:.05,emissive:new THREE.Color(s.color),emissiveIntensity:.06})
      const planet=new THREE.Mesh(new THREE.SphereGeometry(s.size,40,40),mat); planet.userData={kind:'section',id:s.id}; group.add(planet); clickable.push(planet)
      if(s.id==='projects'){
        const atm=new THREE.Mesh(new THREE.SphereGeometry(s.size*1.08,40,40),new THREE.MeshBasicMaterial({color:0x66caff,transparent:true,opacity:.12,side:THREE.BackSide})); group.add(atm)
      }
      if(s.id==='strengths'){
        const satRing=new THREE.Mesh(new THREE.RingGeometry(s.size*1.35,s.size*2.2,64),new THREE.MeshBasicMaterial({color:0xdcc58b,transparent:true,opacity:.7,side:THREE.DoubleSide})); satRing.rotation.x=Math.PI/2.35; group.add(satRing)
      }
      group.add(makeLabel(`${s.planet} · ${s.label}` ,s.color))
      if(s.id!=='education') s.entries.forEach((_,mi)=>{
        const a=(mi/s.entries.length)*Math.PI*2; const mr=s.size*1.9+.28+mi*.08
        const moon=new THREE.Mesh(new THREE.SphereGeometry(.065,14,14),new THREE.MeshStandardMaterial({color:0xd8deea,roughness:.8}))
        moon.position.set(Math.cos(a)*mr, Math.sin(a*1.7)*.13, Math.sin(a)*mr); group.add(moon)
      })
      orbiters.push({pivot,speed:s.speed,planet,base:s.start})
    })

    const skillObjects:THREE.Sprite[]=[]
    skills.forEach(([name,color,i])=>{
      const a=i*2.39996, r=7.2+(i%4)*1.45, y=((i%5)-2)*1.15
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(color),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}))
      sprite.position.set(Math.cos(a)*r,y-1.4,Math.sin(a)*r); const sz=i%3===0?.74:.52; sprite.scale.set(sz,sz,1)
      sprite.userData={kind:'skill',name}; scene.add(sprite); clickable.push(sprite); skillObjects.push(sprite)
    })
    const count=1300,pos=new Float32Array(count*3); for(let i=0;i<count;i++){const r=24+Math.random()*58,a=Math.random()*Math.PI*2,u=Math.random()*2-1;pos[i*3]=Math.cos(a)*Math.sqrt(1-u*u)*r;pos[i*3+1]=u*r*.55;pos[i*3+2]=Math.sin(a)*Math.sqrt(1-u*u)*r}
    const stars=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({color:0xc9d9ff,size:.045,transparent:true,opacity:.72,depthWrite:false})); stars.geometry.setAttribute('position',new THREE.BufferAttribute(pos,3)); scene.add(stars)

    const ray=new THREE.Raycaster(), pointer=new THREE.Vector2(); let hover:THREE.Object3D|null=null, dragging=false, px=0, py=0, sx=0, sy=0, yaw=0, pitch=0
    const pick=(e:PointerEvent)=>{const rect=el.getBoundingClientRect();pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(clickable,false)[0]?.object}
    const move=(e:PointerEvent)=>{if(dragging){yaw+=(e.clientX-px)*.003;pitch=Math.max(-.2,Math.min(.35,pitch+(e.clientY-py)*.002));px=e.clientX;py=e.clientY;return} hover=pick(e)||null; renderer.domElement.style.cursor=hover?'pointer':'grab'}
    const down=(e:PointerEvent)=>{dragging=true;sx=px=e.clientX;sy=py=e.clientY;renderer.domElement.style.cursor='grabbing'}
    const up=(e:PointerEvent)=>{const was=Math.hypot(e.clientX-sx,e.clientY-sy)<5;dragging=false;if(was){const o=pick(e);if(o?.userData.kind==='section')callbacks.current.onSelect(o.userData.id);if(o?.userData.kind==='skill')callbacks.current.onSkill(o.userData.name)}}
    el.addEventListener('pointermove',move);el.addEventListener('pointerdown',down);window.addEventListener('pointerup',up)
    const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)};window.addEventListener('resize',resize)
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches; const clock=new THREE.Clock();let raf=0
    const tick=()=>{const t=clock.getElapsedTime(); orbiters.forEach((o,i)=>{if(!reduce)o.pivot.rotation.y=o.base+t*o.speed*.19;o.planet.rotation.y=t*(.25+i*.015);const target=o.planet.userData.id===activeRef.current?1.28:1;o.planet.scale.lerp(new THREE.Vector3(target,target,target),.08)});const sunScale=activeRef.current==='profile'?1.08:1;sun.scale.lerp(new THREE.Vector3(sunScale,sunScale,sunScale),.08);if(!reduce){corona.material.rotation=t*.035;skillObjects.forEach((s,i)=>s.material.opacity=.62+Math.sin(t*1.7+i)*.22);stars.rotation.y=t*.003}scene.rotation.y+=(yaw-scene.rotation.y)*.05;scene.rotation.x+=(pitch-scene.rotation.x)*.05;renderer.render(scene,camera);raf=requestAnimationFrame(tick)};tick()
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('pointerup',up);el.removeEventListener('pointermove',move);el.removeEventListener('pointerdown',down);renderer.dispose();el.removeChild(renderer.domElement)}
  },[])

  useEffect(()=>{ activeRef.current=active; host.current?.setAttribute('data-active',active) },[active])
  return <div className="solar-system" ref={host} aria-label="可交互的个人太阳系" />
}
