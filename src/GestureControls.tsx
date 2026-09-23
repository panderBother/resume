import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Hand, LoaderCircle, Minimize2, MoveHorizontal, Rotate3D, X } from 'lucide-react'

type GestureMode = 'idle' | 'loading' | 'seeking' | 'rotate' | 'zoom' | 'error'
type Landmark = { x: number; y: number; z: number }
type Point = Pick<Landmark, 'x' | 'y'>

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
]

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const averagePoint = (landmarks: Landmark[], indexes: number[]) => indexes.reduce(
  (point, index) => ({ x: point.x + landmarks[index].x / indexes.length, y: point.y + landmarks[index].y / indexes.length }),
  { x: 0, y: 0 },
)

function drawHands(canvas: HTMLCanvasElement, hands: Landmark[][] = []) {
  const context = canvas.getContext('2d')
  if (!context) return
  context.clearRect(0, 0, canvas.width, canvas.height)
  hands.forEach((landmarks, handIndex) => {
    const color = handIndex === 0 ? '#ffb64c' : '#a9d9ff'
    context.save()
    context.strokeStyle = handIndex === 0 ? 'rgba(255, 190, 92, .72)' : 'rgba(169, 217, 255, .72)'
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
      context.fillStyle = index === 0 || index === 9 ? '#f7f1e5' : color
      context.arc((1 - landmark.x) * canvas.width, landmark.y * canvas.height, index === 0 || index === 9 ? 3.6 : 2.2, 0, Math.PI * 2)
      context.fill()
    })
    context.restore()
  })
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
  const previousTwoHandSpanRef = useRef<number | null>(null)
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
    previousTwoHandSpanRef.current = null
    detectionFailuresRef.current = 0
    if (canvasRef.current) drawHands(canvasRef.current)
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

  const processHands = (hands: Landmark[][]) => {
    if (hands.length === 0) {
      previousPalmRef.current = null
      previousTwoHandSpanRef.current = null
      setMode('seeking')
      return
    }

    if (hands.length >= 2) {
      const [firstHand, secondHand] = hands
      const firstPalm = averagePoint(firstHand, [0, 5, 9, 13, 17])
      const secondPalm = averagePoint(secondHand, [0, 5, 9, 13, 17])
      const averagePalmWidth = Math.max((distance(firstHand[5], firstHand[17]) + distance(secondHand[5], secondHand[17])) / 2, .04)
      const measuredSpan = distance(firstPalm, secondPalm) / averagePalmWidth
      const previousSpan = previousTwoHandSpanRef.current
      const smoothedSpan = previousSpan === null ? measuredSpan : previousSpan * .64 + measuredSpan * .36
      if (previousSpan !== null) {
        const spanDelta = smoothedSpan - previousSpan
        if (Math.abs(spanDelta) > .015) {
          const zoomDelta = Math.max(-.018, Math.min(.018, spanDelta * .12))
          emitGesture(0, 0, zoomDelta)
        }
      }
      previousTwoHandSpanRef.current = smoothedSpan
      previousPalmRef.current = null
      setMode('zoom')
      return
    }

    previousTwoHandSpanRef.current = null
    const landmarks = hands[0]
    const palm = averagePoint(landmarks, [0, 5, 9, 13, 17])
    const mirroredPalm = { x: 1 - palm.x, y: palm.y }
    const previousPalm = previousPalmRef.current
    if (previousPalm) {
      const rotateX = Math.max(-.032, Math.min(.032, mirroredPalm.x - previousPalm.x))
      const rotateY = Math.max(-.032, Math.min(.032, mirroredPalm.y - previousPalm.y))
      if (Math.abs(rotateX) + Math.abs(rotateY) > .0025) emitGesture(rotateX, rotateY, 0)
    }
    previousPalmRef.current = mirroredPalm
    setMode('rotate')
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
          const hands = result.landmarks.slice(0, 2)
          processHands(hands)
          if (canvasRef.current) drawHands(canvasRef.current, hands)
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
        numHands: 2,
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
    idle: '手势操控', loading: '正在启动', seeking: '请举起一只或两只手', rotate: '单手移动视角', zoom: '双手伸合缩放', error: '启动失败',
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
        <span><Rotate3D size={14} />单手移动<small>旋转查看</small></span>
        <span><Hand size={13} /><MoveHorizontal size={12} /><Hand size={13} />双手伸合<small>放大缩小</small></span>
      </div>}
      {mode === 'error' && <button className="gesture-retry" type="button" onClick={start}>重新尝试</button>}
    </section>}
    {!open && <button className="gesture-toggle" type="button" onClick={start} aria-label="开启摄像头手势控制">
      <Camera size={16} /><span>手势操控</span><small>CAM</small>
    </button>}
  </div>
}
