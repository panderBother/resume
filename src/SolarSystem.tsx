import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { sections, skills } from './data'

type Props = { active: string; onSelect: (id: string) => void; onSkill: (name: string) => void }

function glowTexture(color = '#ffffff') {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  glow.addColorStop(0, '#fff')
  glow.addColorStop(.1, color)
  glow.addColorStop(.38, `${color}70`)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

export default function SolarSystem({ active, onSelect, onSkill }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  const callbacks = useRef({ onSelect, onSkill })
  callbacks.current = { onSelect, onSkill }
  activeRef.current = active

  useEffect(() => {
    const mount = host.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x020409, .008)
    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, .08, 220)
    camera.position.set(0, 12, 21)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    mount.prepend(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = .055
    controls.enablePan = false
    controls.rotateSpeed = .48
    controls.zoomSpeed = .75
    controls.minDistance = 1.35
    controls.maxDistance = 38
    controls.maxPolarAngle = Math.PI * .79
    controls.minPolarAngle = Math.PI * .17
    controls.target.set(0, 0, 0)
    controls.update()

    scene.add(new THREE.AmbientLight(0x6b7895, .3))
    scene.add(new THREE.HemisphereLight(0x6177a0, 0x08090d, .34))
    scene.add(new THREE.PointLight(0xffc465, 62, 54, 1.6))

    const clickable: THREE.Object3D[] = []
    const objects = new Map<string, THREE.Object3D>()
    const orbiters: { pivot: THREE.Group; speed: number; planet: THREE.Mesh; base: number }[] = []

    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.26, 72, 72), new THREE.MeshBasicMaterial({ color: 0xffa52e }))
    sun.userData = { kind: 'section', id: 'profile', label: '太阳 · 个人简介' }
    scene.add(sun)
    clickable.push(sun)
    objects.set('profile', sun)

    const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#ff9e32'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
    corona.scale.set(6.4, 6.4, 1)
    scene.add(corona)
    const solarHalo = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.78, 96), new THREE.MeshBasicMaterial({ color: 0xffbd62, transparent: true, opacity: .08, side: THREE.DoubleSide }))
    solarHalo.rotation.x = -Math.PI / 2
    scene.add(solarHalo)

    sections.forEach((section) => {
      const curve = new THREE.EllipseCurve(0, 0, section.radius, section.radius * .72, 0, Math.PI * 2)
      const orbitPoints = curve.getPoints(180).map((p) => new THREE.Vector3(p.x, 0, p.y))
      scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(orbitPoints), new THREE.LineBasicMaterial({ color: 0x8491a3, transparent: true, opacity: .16 })))

      const pivot = new THREE.Group()
      pivot.rotation.y = section.start
      scene.add(pivot)
      const group = new THREE.Group()
      group.position.set(section.radius, 0, 0)
      pivot.add(group)

      const planet = new THREE.Mesh(new THREE.SphereGeometry(section.size, 52, 52), new THREE.MeshStandardMaterial({ color: section.color, roughness: .76, metalness: .025, emissive: new THREE.Color(section.color), emissiveIntensity: .035 }))
      planet.userData = { kind: 'section', id: section.id, label: `${section.planet} · ${section.label}` }
      group.add(planet)
      clickable.push(planet)
      objects.set(section.id, planet)

      if (section.id === 'projects') group.add(new THREE.Mesh(new THREE.SphereGeometry(section.size * 1.075, 48, 48), new THREE.MeshBasicMaterial({ color: 0x68bfff, transparent: true, opacity: .1, side: THREE.BackSide })))
      if (section.id === 'strengths') {
        const ring = new THREE.Mesh(new THREE.RingGeometry(section.size * 1.35, section.size * 2.3, 96), new THREE.MeshBasicMaterial({ color: 0xdcc58b, transparent: true, opacity: .66, side: THREE.DoubleSide }))
        ring.rotation.x = Math.PI / 2.35
        group.add(ring)
      }

      if (section.id !== 'education') section.entries.forEach((_, index) => {
        const angle = (index / section.entries.length) * Math.PI * 2
        const moonRadius = section.size * 1.9 + .26 + index * .075
        const moon = new THREE.Mesh(new THREE.SphereGeometry(.066, 16, 16), new THREE.MeshStandardMaterial({ color: 0xdde1e8, roughness: .86 }))
        moon.position.set(Math.cos(angle) * moonRadius, Math.sin(angle * 1.7) * .12, Math.sin(angle) * moonRadius)
        group.add(moon)
      })
      orbiters.push({ pivot, speed: section.speed, planet, base: section.start })
    })

    const skillSprites: THREE.Sprite[] = []
    skills.forEach(([name, color, index]) => {
      const angle = index * 2.39996
      const radius = 14.5 + (index % 4) * 2.2
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(color), transparent: true, opacity: .46, blending: THREE.AdditiveBlending, depthWrite: false }))
      sprite.position.set(Math.cos(angle) * radius, ((index % 5) - 2) * 1.8, Math.sin(angle) * radius)
      const size = index % 3 === 0 ? .55 : .38
      sprite.scale.set(size, size, 1)
      sprite.userData = { kind: 'skill', name, label: `技能 · ${name}` }
      scene.add(sprite)
      clickable.push(sprite)
      skillSprites.push(sprite)
    })

    const count = 1750
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const radius = 28 + Math.random() * 80
      const angle = Math.random() * Math.PI * 2
      const unit = Math.random() * 2 - 1
      positions[i * 3] = Math.cos(angle) * Math.sqrt(1 - unit * unit) * radius
      positions[i * 3 + 1] = unit * radius * .58
      positions[i * 3 + 2] = Math.sin(angle) * Math.sqrt(1 - unit * unit) * radius
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcbd9f4, size: .05, transparent: true, opacity: .72, depthWrite: false }))
    scene.add(stars)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let pointerDown = { x: 0, y: 0 }
    let hovered: THREE.Object3D | undefined
    let lastActive = 'profile'
    let focusAmount = 1
    const focusFromCamera = new THREE.Vector3()
    const focusFromTarget = new THREE.Vector3()
    const desiredTarget = new THREE.Vector3()
    const desiredCamera = new THREE.Vector3()
    const previousTarget = new THREE.Vector3()

    const pick = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      return raycaster.intersectObjects(clickable, false)[0]?.object
    }
    const onMove = (event: PointerEvent) => {
      if (event.buttons) { if (tip.current) tip.current.hidden = true; return }
      hovered = pick(event)
      renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab'
      if (!tip.current) return
      if (!hovered) { tip.current.hidden = true; return }
      const rect = mount.getBoundingClientRect()
      tip.current.hidden = false
      tip.current.textContent = hovered.userData.label
      tip.current.style.transform = `translate(${event.clientX - rect.left + 14}px, ${event.clientY - rect.top + 14}px)`
    }
    const onDown = (event: PointerEvent) => { pointerDown = { x: event.clientX, y: event.clientY }; renderer.domElement.style.cursor = 'grabbing' }
    const onUp = (event: PointerEvent) => {
      renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab'
      if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) return
      const selected = pick(event)
      if (selected?.userData.kind === 'section') callbacks.current.onSelect(selected.userData.id)
      if (selected?.userData.kind === 'skill') callbacks.current.onSkill(selected.userData.name)
    }
    renderer.domElement.addEventListener('pointermove', onMove)
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const clock = new THREE.Clock()
    let elapsed = 0
    let raf = 0
    const animate = () => {
      elapsed += Math.min(clock.getDelta(), .05)
      orbiters.forEach((orbiter, index) => {
        if (!reducedMotion && activeRef.current === 'profile') orbiter.pivot.rotation.y = orbiter.base + elapsed * orbiter.speed * .17
        orbiter.planet.rotation.y += .0025 + index * .0001
      })
      if (!reducedMotion) {
        corona.material.rotation = elapsed * .03
        stars.rotation.y = elapsed * .002
        skillSprites.forEach((sprite, index) => { sprite.material.opacity = .34 + Math.sin(elapsed * 1.2 + index) * .12 })
      }

      const selectedId = activeRef.current
      if (selectedId !== lastActive) {
        lastActive = selectedId
        focusAmount = 0
        focusFromCamera.copy(camera.position)
        focusFromTarget.copy(controls.target)
        previousTarget.copy(controls.target)
      }
      const selectedObject = objects.get(selectedId) || sun
      selectedObject.getWorldPosition(desiredTarget)
      const section = sections.find((item) => item.id === selectedId)
      const distance = selectedId === 'profile' ? 22 : Math.max(2.1, (section?.size || .4) * 5.2)
      desiredCamera.copy(desiredTarget).addScaledVector(new THREE.Vector3(.72, .42, 1).normalize(), distance)

      if (focusAmount < 1) {
        focusAmount = Math.min(1, focusAmount + .026)
        const eased = 1 - Math.pow(1 - focusAmount, 3)
        camera.position.lerpVectors(focusFromCamera, desiredCamera, eased)
        controls.target.lerpVectors(focusFromTarget, desiredTarget, eased)
        previousTarget.copy(controls.target)
      } else if (selectedId !== 'profile') {
        const delta = desiredTarget.clone().sub(previousTarget)
        camera.position.add(delta)
        controls.target.copy(desiredTarget)
        previousTarget.copy(desiredTarget)
      }
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      controls.dispose()
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointermove', onMove)
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div className="solar-system" ref={host} aria-label="可旋转和缩放的个人太阳系"><div className="celestial-tip" ref={tip} hidden /></div>
}
