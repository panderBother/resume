import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { sections, skills } from './data'

type Props = { active: string; interactive: boolean; onSelect: (id: string) => void; onSkill: (name: string) => void }

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

export default function SolarSystem({ active, interactive, onSelect, onSkill }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  const interactiveRef = useRef(interactive)
  const callbacks = useRef({ onSelect, onSkill })
  callbacks.current = { onSelect, onSkill }
  activeRef.current = active
  interactiveRef.current = interactive

  useEffect(() => {
    const mount = host.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x020409, .008)
    const isMobileViewport = () => mount.clientWidth <= 700
    const camera = new THREE.PerspectiveCamera(isMobileViewport() ? 47 : 42, mount.clientWidth / mount.clientHeight, .08, 220)
    camera.position.set(0, isMobileViewport() ? 15 : 12, isMobileViewport() ? 26 : 21)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    mount.prepend(renderer.domElement)

    const textureLoader = new THREE.TextureLoader()
    const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
    const textureFiles: Record<string, string> = {
      profile: asset('textures/sun.jpg'), internship: asset('textures/mercury.jpg'), projects: asset('textures/earth.jpg'),
      education: asset('textures/mars.jpg'), strengths: asset('textures/saturn.jpg'),
    }
    const loadTexture = (url: string) => {
      const texture = textureLoader.load(url)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
      return texture
    }
    const surfaceTextures = Object.fromEntries(Object.entries(textureFiles).map(([id, url]) => [id, loadTexture(url)]))
    const moonTexture = loadTexture(asset('textures/moon.jpg'))
    const earthCloudTexture = loadTexture(asset('textures/earth-clouds.jpg'))
    const saturnRingTexture = loadTexture(asset('textures/saturn-ring.png'))
    const starFieldTexture = loadTexture(asset('textures/stars.jpg'))
    const moonBumpTexture = textureLoader.load(asset('textures/moon.jpg'))
    moonBumpTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

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

    let gestureRotateX = 0
    let gestureRotateY = 0
    let gestureZoom = 0
    const onGesture = (event: Event) => {
      const { rotateX = 0, rotateY = 0, zoom = 0 } = (event as CustomEvent<{ rotateX: number; rotateY: number; zoom: number }>).detail || {}
      gestureRotateX += rotateX
      gestureRotateY += rotateY
      gestureZoom += zoom
    }
    window.addEventListener('solar-gesture', onGesture)

    scene.add(new THREE.AmbientLight(0x6b7895, .3))
    scene.add(new THREE.HemisphereLight(0x6177a0, 0x08090d, .34))
    scene.add(new THREE.PointLight(0xffc465, 62, 54, 1.6))

    const clickable: THREE.Object3D[] = []
    const objects = new Map<string, THREE.Object3D>()
    const orbiters: { pivot: THREE.Group; speed: number; planet: THREE.Mesh; base: number }[] = []
    const satelliteOrbiters: { pivot: THREE.Group; moon: THREE.Mesh; speed: number }[] = []

    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.26, 72, 72), new THREE.MeshBasicMaterial({ map: surfaceTextures.profile }))
    sun.userData = { kind: 'section', id: 'profile', label: '太阳 · 个人简介' }
    scene.add(sun)
    clickable.push(sun)
    objects.set('profile', sun)

    const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#ff9e32'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
    corona.scale.set(6.4, 6.4, 1)
    scene.add(corona)
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

      const planet = new THREE.Mesh(new THREE.SphereGeometry(section.size, 64, 64), new THREE.MeshStandardMaterial({
        map: surfaceTextures[section.id], roughness: section.id === 'projects' ? .67 : .82, metalness: 0,
      }))
      planet.userData = { kind: 'section', id: section.id, label: `${section.planet} · ${section.label}` }
      group.add(planet)
      clickable.push(planet)
      objects.set(section.id, planet)

      if (section.id === 'projects') {
        group.add(new THREE.Mesh(new THREE.SphereGeometry(section.size * 1.075, 48, 48), new THREE.MeshBasicMaterial({ color: 0x68bfff, transparent: true, opacity: .1, side: THREE.BackSide })))
        const clouds = new THREE.Mesh(new THREE.SphereGeometry(section.size * 1.018, 64, 64), new THREE.MeshStandardMaterial({
          map: earthCloudTexture, alphaMap: earthCloudTexture, transparent: true, opacity: .72, depthWrite: false, roughness: 1,
        }))
        clouds.userData.cloudLayer = true
        group.add(clouds)
      }
      if (section.id === 'strengths') {
        const inner = section.size * 1.35
        const outer = section.size * 2.45
        const ringGeometry = new THREE.RingGeometry(inner, outer, 128, 8)
        const position = ringGeometry.attributes.position
        const uv = ringGeometry.attributes.uv
        for (let i = 0; i < position.count; i++) {
          const radius = Math.hypot(position.getX(i), position.getY(i))
          uv.setXY(i, (radius - inner) / (outer - inner), .5)
        }
        const ring = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({ map: saturnRingTexture, transparent: true, opacity: .92, side: THREE.DoubleSide, depthWrite: false }))
        ring.rotation.x = Math.PI / 2.35
        group.add(ring)
      }

      if (section.id !== 'education') section.entries.forEach((entry, index) => {
        const angle = (index / section.entries.length) * Math.PI * 2
        const moonRadius = section.size * 1.9 + .26 + index * .075
        const moonSize = Math.max(.085, Math.min(.14, section.size * .19))
        const moonOrbit = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(
            new THREE.EllipseCurve(0, 0, moonRadius, moonRadius, 0, Math.PI * 2).getPoints(64).map((point) => new THREE.Vector3(point.x, 0, point.y)),
          ),
          new THREE.LineBasicMaterial({ color: 0xaeb7c2, transparent: true, opacity: .12 }),
        )
        group.add(moonOrbit)

        const satellitePivot = new THREE.Group()
        satellitePivot.rotation.y = angle
        satellitePivot.rotation.z = (index % 2 ? 1 : -1) * (.035 + index * .012)
        group.add(satellitePivot)
        const moon = new THREE.Mesh(new THREE.SphereGeometry(moonSize, 32, 32), new THREE.MeshStandardMaterial({
          map: moonTexture,
          bumpMap: moonBumpTexture,
          bumpScale: moonSize * .16,
          roughness: .94,
          metalness: 0,
        }))
        moon.position.set(moonRadius, 0, 0)
        moon.rotation.set(index * .7, index * 1.3, index * .35)
        const entryName = section.id === 'internship'
          ? entry.org.split(' · ')[0]
          : section.id === 'projects'
            ? entry.role.split(' · ')[0]
            : entry.role
        const entryDetail = section.id === 'projects'
          ? entry.role.split(' · ')[1] || entry.org
          : entry.role
        moon.userData = { kind: 'entry', sectionId: section.id, label: entryName, category: section.label, detail: entryDetail }
        satellitePivot.add(moon)
        clickable.push(moon)
        satelliteOrbiters.push({ pivot: satellitePivot, moon, speed: .18 + index * .055 + section.speed * .25 })
      })
      orbiters.push({ pivot, speed: section.speed, planet, base: section.start })
    })

    const skillSprites: THREE.Sprite[] = []
    skills.forEach(([name, color, index]) => {
      const angle = index * 2.39996
      const radius = 5.2 + ((index * 3) % 8) * 1.12
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(color), transparent: true, opacity: .46, blending: THREE.AdditiveBlending, depthWrite: false }))
      sprite.position.set(Math.cos(angle) * radius, ((index * 2) % 7 - 3) * .82, Math.sin(angle) * radius)
      const size = index % 3 === 0 ? .62 : .43
      sprite.scale.set(size, size, 1)
      sprite.userData = { kind: 'skill', name, label: `技能 · ${name}` }
      scene.add(sprite)
      clickable.push(sprite)
      skillSprites.push(sprite)
    })

    const sky = new THREE.Mesh(new THREE.SphereGeometry(110, 48, 32), new THREE.MeshBasicMaterial({ map: starFieldTexture, side: THREE.BackSide, transparent: true, opacity: .72, depthWrite: false }))
    sky.rotation.y = .7
    scene.add(sky)

    const count = 2100
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const starPalette = [new THREE.Color(0xc9d9ff), new THREE.Color(0xffffff), new THREE.Color(0xffe2bb), new THREE.Color(0x9fc5ff)]
    for (let i = 0; i < count; i++) {
      const radius = 28 + Math.random() * 80
      const angle = Math.random() * Math.PI * 2
      const unit = Math.random() * 2 - 1
      positions[i * 3] = Math.cos(angle) * Math.sqrt(1 - unit * unit) * radius
      positions[i * 3 + 1] = unit * radius * .58
      positions[i * 3 + 2] = Math.sin(angle) * Math.sqrt(1 - unit * unit) * radius
      const color = starPalette[i % starPalette.length]
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ map: glowTexture('#ffffff'), size: .075, transparent: true, opacity: .62, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending, alphaTest: .03 }))
    scene.add(stars)

    const brightCount = 150
    const brightPositions = new Float32Array(brightCount * 3)
    const brightColors = new Float32Array(brightCount * 3)
    for (let i = 0; i < brightCount; i++) {
      const radius = 24 + Math.random() * 66
      const angle = Math.random() * Math.PI * 2
      const unit = Math.random() * 2 - 1
      brightPositions[i * 3] = Math.cos(angle) * Math.sqrt(1 - unit * unit) * radius
      brightPositions[i * 3 + 1] = unit * radius * .62
      brightPositions[i * 3 + 2] = Math.sin(angle) * Math.sqrt(1 - unit * unit) * radius
      const color = starPalette[(i * 3) % starPalette.length]
      brightColors[i * 3] = color.r; brightColors[i * 3 + 1] = color.g; brightColors[i * 3 + 2] = color.b
    }
    const brightGeo = new THREE.BufferGeometry()
    brightGeo.setAttribute('position', new THREE.BufferAttribute(brightPositions, 3))
    brightGeo.setAttribute('color', new THREE.BufferAttribute(brightColors, 3))
    const brightStars = new THREE.Points(brightGeo, new THREE.PointsMaterial({ map: glowTexture('#ffffff'), size: .24, transparent: true, opacity: .7, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending, alphaTest: .025 }))
    scene.add(brightStars)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let hovered: THREE.Object3D | undefined
    let lastActive = 'profile'
    let focusAmount = 1
    const focusFromCamera = new THREE.Vector3()
    const focusFromTarget = new THREE.Vector3()
    const desiredTarget = new THREE.Vector3()
    const desiredCamera = new THREE.Vector3()
    const previousTarget = new THREE.Vector3()

    const pick = (event: PointerEvent | MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(clickable, false)[0]?.object
      if (hit) return hit
      let nearest: THREE.Object3D | undefined
      let nearestDistance = Infinity
      const world = new THREE.Vector3()
      const projected = new THREE.Vector3()
      clickable.forEach((object) => {
        object.getWorldPosition(world)
        projected.copy(world).project(camera)
        if (projected.z < -1 || projected.z > 1) return
        const screenX = rect.left + (projected.x + 1) * rect.width / 2
        const screenY = rect.top + (1 - projected.y) * rect.height / 2
        const distance = Math.hypot(event.clientX - screenX, event.clientY - screenY)
        const radius = object.userData.id === 'profile' ? 68 : object.userData.kind === 'skill' ? 16 : 24
        if (distance < radius && distance < nearestDistance) { nearest = object; nearestDistance = distance }
      })
      return nearest
    }
    const onMove = (event: PointerEvent) => {
      if (event.buttons) return
      hovered = pick(event)
      renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab'
    }
    renderer.domElement.addEventListener('pointermove', onMove)

    const tooltip = document.createElement('div')
    tooltip.className = 'celestial-tooltip'
    tooltip.setAttribute('role', 'tooltip')
    tooltip.innerHTML = '<small></small><strong></strong><span></span>'
    mount.appendChild(tooltip)
    let tooltipTarget: THREE.Object3D | null = null
    const showTooltip = (object: THREE.Object3D) => {
      if (!interactiveRef.current) return
      if (tooltipTarget?.userData.kind === 'entry' && tooltipTarget !== object) tooltipTarget.scale.setScalar(1)
      tooltipTarget = object
      const isEntry = object.userData.kind === 'entry'
      tooltip.querySelector('small')!.textContent = isEntry
        ? object.userData.category
        : object.userData.kind === 'skill'
          ? '专业技能'
          : object.userData.id === 'profile' ? '太阳' : '行星导航'
      tooltip.querySelector('strong')!.textContent = object.userData.label
      tooltip.querySelector('span')!.textContent = isEntry
        ? `${object.userData.detail} · 点击查看详情`
        : '点击查看'
      if (isEntry) object.scale.setScalar(1.65)
      tooltip.classList.add('is-visible')
    }
    const hideTooltip = () => {
      if (tooltipTarget?.userData.kind === 'entry') tooltipTarget.scale.setScalar(1)
      tooltipTarget = null
      tooltip.classList.remove('is-visible')
    }

    const hitTargets = clickable.map((object) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'celestial-hit'
      const isEntry = object.userData.kind === 'entry'
      button.setAttribute('aria-label', isEntry ? `查看${object.userData.category}：${object.userData.label}` : `查看${object.userData.label}`)
      button.title = isEntry ? `${object.userData.category}：${object.userData.label}` : object.userData.label
      if (isEntry) button.classList.add('satellite-hit')
      button.addEventListener('pointerenter', () => showTooltip(object))
      button.addEventListener('pointerleave', hideTooltip)
      button.addEventListener('focus', () => showTooltip(object))
      button.addEventListener('blur', hideTooltip)
      button.addEventListener('click', () => {
        hideTooltip()
        if (object.userData.kind === 'section') callbacks.current.onSelect(object.userData.id)
        if (object.userData.kind === 'entry') callbacks.current.onSelect(object.userData.sectionId)
        if (object.userData.kind === 'skill') callbacks.current.onSkill(object.userData.name)
      })
      mount.appendChild(button)
      return { object, button }
    })

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.fov = isMobileViewport() ? 47 : 42
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarsePointer = matchMedia('(pointer: coarse)').matches
    let lastFrame = performance.now()
    let elapsed = 0
    let raf = 0
    const animate = (now = performance.now()) => {
      const frameDelta = Math.min((now - lastFrame) / 1000, .05)
      elapsed += frameDelta
      lastFrame = now
      orbiters.forEach((orbiter, index) => {
        if (!reducedMotion && activeRef.current === 'overview') orbiter.pivot.rotation.y = orbiter.base + elapsed * orbiter.speed * .17
        orbiter.planet.rotation.y += .0025 + index * .0001
        const clouds = orbiter.planet.parent?.children.find((child) => child.userData.cloudLayer)
        if (clouds) clouds.rotation.y += .0031
      })
      satelliteOrbiters.forEach(({ pivot, moon, speed }, index) => {
        if (!reducedMotion && tooltipTarget !== moon) pivot.rotation.y += frameDelta * speed
        if (!reducedMotion) moon.rotation.y += frameDelta * (.12 + index * .008)
      })
      if (!reducedMotion) {
        corona.material.rotation = elapsed * .03
        stars.rotation.y = elapsed * .002
        brightStars.rotation.y = -elapsed * .0012
        sky.rotation.y += .000015
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
      if (isMobileViewport() && selectedId !== 'overview') desiredTarget.y -= 1.15
      const section = sections.find((item) => item.id === selectedId)
      const distance = selectedId === 'overview'
        ? (isMobileViewport() ? 26 : 22)
        : selectedId === 'profile'
          ? (isMobileViewport() ? 5.8 : 4.4)
          : Math.max(isMobileViewport() ? 3.2 : 2.1, (section?.size || .4) * (isMobileViewport() ? 6.6 : 5.2))
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

      if (Math.abs(gestureRotateX) + Math.abs(gestureRotateY) + Math.abs(gestureZoom) > .0001) {
        const cameraOffset = camera.position.clone().sub(controls.target)
        const spherical = new THREE.Spherical().setFromVector3(cameraOffset)
        spherical.theta -= gestureRotateX * 2.35
        spherical.phi = THREE.MathUtils.clamp(spherical.phi + gestureRotateY * 1.9, controls.minPolarAngle, controls.maxPolarAngle)
        spherical.radius = THREE.MathUtils.clamp(spherical.radius * Math.exp(-gestureZoom * 4.8), controls.minDistance, controls.maxDistance)
        camera.position.copy(controls.target).add(cameraOffset.setFromSpherical(spherical))
        gestureRotateX *= .58
        gestureRotateY *= .58
        gestureZoom *= .5
      }
      controls.update()
      const hitWorld = new THREE.Vector3()
      const hitProjected = new THREE.Vector3()
      hitTargets.forEach(({ object, button }) => {
        object.getWorldPosition(hitWorld)
        hitProjected.copy(hitWorld).project(camera)
        const visible = hitProjected.z >= -1 && hitProjected.z <= 1
        button.hidden = !visible || !interactiveRef.current
        if (!visible) return
        const size = object.userData.id === 'profile'
          ? (coarsePointer ? 104 : 86)
          : object.userData.kind === 'skill'
            ? (coarsePointer ? 38 : 22)
            : object.userData.kind === 'entry'
              ? (coarsePointer ? 48 : 38)
              : (coarsePointer ? 54 : 38)
        button.style.width = `${size}px`
        button.style.height = `${size}px`
        button.style.transform = `translate(${(hitProjected.x + 1) * mount.clientWidth / 2 - size / 2}px, ${(1 - hitProjected.y) * mount.clientHeight / 2 - size / 2}px)`
        if (tooltipTarget === object && interactiveRef.current) {
          const x = (hitProjected.x + 1) * mount.clientWidth / 2
          const y = (1 - hitProjected.y) * mount.clientHeight / 2
          tooltip.style.transform = `translate(${x}px, ${y - size / 2 - 12}px)`
        }
      })
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      controls.dispose()
      window.removeEventListener('solar-gesture', onGesture)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointermove', onMove)
      hitTargets.forEach(({ button }) => button.remove())
      tooltip.remove()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div className="solar-system" ref={host} aria-label="可旋转和缩放的个人太阳系" />
}
