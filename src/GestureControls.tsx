import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Hand, LoaderCircle, Minus, Minimize2, Plus, Rotate3D, X } from 'lucide-react'

type GestureMode = 'idle' | 'loading' | 'seeking' | 'rotate' | 'zoom' | 'error'
type Landmark = { x: number; y: number; z: number }

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
]

const distance = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y)
const averagePoint = (landmarks: Landmark[], indexes: number[]) => indexes.reduce(
  (point, index) => ({ x: point.x + landmarks[index].x / indexes.length, y: point.y + landmarks[index].y / indexes.length }),
  { x: 0, y: 0 },
)

function drawHand(canvas: HTMLCanvasElement, landmarks?: Landmark[]) {
  const context = canvas.getContext('2d')
  if (!context) return
  context.clearRect(0, 0, canvas.width, canvas.height)
  if (!landmarks) return
  context.save()
  context.strokeStyle = 'rgba(255, 190, 92, .72)'
  context.lineWidth = 2
  context.lineCap = 'round'
  HAND_CONNECTIONS.forEach(([from, to]) => {
    context.beginPath()
    context.moveTo((1 - landmarks[from].x) * canvas.width, landmarks[from].y * canvas.height)
    context.lineTo((1 - landmarks[to].x) * canvas.width, landmarks[to].y * canvas.height)
    context.stroke()
  })
  landmarks.forEach((landmark, index) => {
    context.beginPath()
    context.fillStyle = index === 4 || index === 8 ? '#fff1d2' : '#ffb64c'
    context.arc((1 - landmark.x) * canvas.width, landmark.y * canvas.height, index === 4 || index === 8 ? 3.8 : 2.2, 0, Math.PI * 2)
    context.fill()
  })
  context.restore()
}

export default function GestureControls() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<{ detectForVideo: (video: HTMLVideoElement, timestamp: number) => { landmarks: Landmark[][] }; close: () => void } | null>(null)
  const rafRef = useRef(0)
  const lastInferenceRef = useRef(0)
  const detectionFailuresRef = useRef(0)
  const previousPalmRef = useRef<{ x: number; y: number } | null>(null)
  const previousPinchRef = useRef<number | null>(null)
  const [mode, setMode] = useState<GestureMode>('idle')
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [error, setError] = useState('')

  const stop = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    detectorRef.current?.close()
    streamRef.current = null
    detectorRef.current = null
    previousPalmRef.current = null
    previousPinchRef.current = null
    detectionFailuresRef.current = 0
    if (canvasRef.current) drawHand(canvasRef.current)
    setMode('idle')
    setOpen(false)
    setMinimized(false)
  }

  useEffect(() => stop, [])
  useEffect(() => {
    if (mode !== 'rotate' && mode !== 'zoom') return
    const timer = window.setTimeout(() => setMinimized(true), 1200)
    return () => window.clearTimeout(timer)
  }, [mode])

  const emitGesture = (rotateX: number, rotateY: number, zoom: number) => {
    window.dispatchEvent(new CustomEvent('solar-gesture', { detail: { rotateX, rotateY, zoom } }))
  }

  const processHand = (landmarks?: Landmark[]) => {
    if (!landmarks) {
      previousPalmRef.current = null
      previousPinchRef.current = null
      setMode('seeking')
      return
    }

    const palmWidth = Math.max(distance(landmarks[5], landmarks[17]), .04)
    const pinch = distance(landmarks[4], landmarks[8]) / palmWidth
    const palm = averagePoint(landmarks, [0, 5, 9, 13, 17])
    const mirroredPalm = { x: 1 - palm.x, y: palm.y }
    const extendedFingers = [[8, 6], [12, 10], [16, 14], [20, 18]].filter(([tip, joint]) => (
      distance(landmarks[tip], landmarks[0]) > distance(landmarks[joint], landmarks[0]) * 1.12
    )).length

    if (pinch < .72) {
      const previousPinch = previousPinchRef.current
      if (previousPinch !== null) {
        const zoomDelta = Math.max(-.055, Math.min(.055, pinch - previousPinch))
        if (Math.abs(zoomDelta) > .003) emitGesture(0, 0, zoomDelta)
      }
      previousPinchRef.current = pinch
      previousPalmRef.current = mirroredPalm
      setMode('zoom')
      return
    }

    previousPinchRef.current = null
    if (extendedFingers >= 3) {
      const previousPalm = previousPalmRef.current
      if (previousPalm) {
        const rotateX = Math.max(-.035, Math.min(.035, mirroredPalm.x - previousPalm.x))
        const rotateY = Math.max(-.035, Math.min(.035, mirroredPalm.y - previousPalm.y))
        if (Math.abs(rotateX) + Math.abs(rotateY) > .0025) emitGesture(rotateX, rotateY, 0)
      }
      previousPalmRef.current = mirroredPalm
      setMode('rotate')
    } else {
      previousPalmRef.current = mirroredPalm
      setMode('seeking')
    }
  }

  const startLoop = () => {
    const tick = (now: number) => {
      const video = videoRef.current
      const detector = detectorRef.current
      if (video && detector && video.readyState >= 2 && now - lastInferenceRef.current >= 66) {
        lastInferenceRef.current = now
        try {
          const result = detector.detectForVideo(video, now)
          detectionFailuresRef.current = 0
          const hand = result.landmarks[0]
          processHand(hand)
          if (canvasRef.current) drawHand(canvasRef.current, hand)
        } catch {
          detectionFailuresRef.current += 1
          if (detectionFailuresRef.current >= 3) {
            streamRef.current?.getTracks().forEach((track) => track.stop())
            detectorRef.current?.close()
            streamRef.current = null
            detectorRef.current = null
            setError('手势识别暂时中断，请重新开启摄像头')
            setMode('error')
            return
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const start = async () => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError('摄像头手势需要在 HTTPS 环境中使用')
      setMode('error')
      setOpen(true)
      return
    }
    setMode('loading')
    setOpen(true)
    setMinimized(false)
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) throw new Error('video-unavailable')
      video.srcObject = stream
      await video.play()

      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm')
      const options = {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        },
        runningMode: 'VIDEO' as const,
        numHands: 1,
        minHandDetectionConfidence: .55,
        minHandPresenceConfidence: .5,
        minTrackingConfidence: .5,
      }
      detectorRef.current = await HandLandmarker.createFromOptions(vision, options)
      setMode('seeking')
      startLoop()
    } catch (reason) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      const name = reason instanceof DOMException ? reason.name : ''
      setError(name === 'NotAllowedError'
        ? '未获得摄像头权限，请在浏览器地址栏中允许访问'
        : name === 'NotFoundError'
          ? '没有检测到可用摄像头'
          : '摄像头或手势模型加载失败，请稍后重试')
      setMode('error')
    }
  }

  const labels: Record<GestureMode, string> = {
    idle: '手势操控', loading: '正在启动', seeking: '请举起一只手', rotate: '手掌旋转中', zoom: '捏合缩放中', error: '启动失败',
  }
  const active = mode !== 'idle' && mode !== 'error'

  return <div className={`gesture-control ${open ? 'is-open' : ''} ${active ? 'is-active' : ''}`}>
    {open && minimized && <div className="gesture-mini" aria-live="polite">
      <button type="button" className="gesture-expand" onClick={() => setMinimized(false)} aria-label="展开摄像头手势状态">
        <Camera size={14} /><i className={`mode-${mode}`} /><span>{labels[mode]}</span>
      </button>
      <button type="button" className="gesture-stop" onClick={stop} aria-label="关闭摄像头手势控制"><X size={14} /></button>
    </div>}
    {open && <section className={`gesture-panel ${minimized ? 'is-minimized' : ''}`} aria-live="polite" aria-hidden={minimized}>
      <header>
        <span><i /> CAMERA GESTURE</span>
        <div>
          {mode !== 'loading' && mode !== 'error' && <button type="button" onClick={() => setMinimized(true)} aria-label="收起摄像头预览"><Minimize2 size={14} /></button>}
          <button type="button" onClick={stop} aria-label="关闭摄像头手势控制"><X size={15} /></button>
        </div>
      </header>
      <div className="gesture-preview">
        <video ref={videoRef} muted playsInline />
        <canvas ref={canvasRef} width="240" height="180" />
        {mode === 'loading' && <div className="gesture-loading"><LoaderCircle size={20} />加载识别模型</div>}
        {mode === 'error' && <div className="gesture-error"><CameraOff size={19} /><span>{error}</span></div>}
      </div>
      <div className="gesture-readout"><i className={`mode-${mode}`} /><strong>{labels[mode]}</strong><span>画面仅在本机处理</span></div>
      {mode !== 'error' && <div className="gesture-guide">
        <span><Rotate3D size={14} />张开手掌移动<small>旋转查看</small></span>
        <span><Hand size={14} /><Minus size={9} /><Plus size={9} />拇指食指捏合<small>放大缩小</small></span>
      </div>}
      {mode === 'error' && <button className="gesture-retry" type="button" onClick={start}>重新尝试</button>}
    </section>}
    {!open && <button className="gesture-toggle" type="button" onClick={start} aria-label="开启摄像头手势控制">
      <Camera size={16} /><span>手势操控</span><small>CAM</small>
    </button>}
  </div>
}
