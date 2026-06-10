import * as React from "react"
import * as cocossd from "@tensorflow-models/coco-ssd"
import "@tensorflow/tfjs"

type Detection = cocossd.DetectedObject

type ContainRect = {
  x: number
  y: number
  width: number
  height: number
}

const INITIAL_STATUS = "Upload an image to start scanning."
const MIN_CONFIDENCE = 0.45

function getContainRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): ContainRect {
  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = targetWidth / targetHeight

  if (sourceRatio > targetRatio) {
    const width = targetWidth
    const height = width / sourceRatio
    return { x: 0, y: (targetHeight - height) / 2, width, height }
  }

  const height = targetHeight
  const width = height * sourceRatio
  return { x: (targetWidth - width) / 2, y: 0, width, height }
}

export function VisionScanner() {
  const modelRef = React.useRef<cocossd.ObjectDetection | null>(null)
  const modelPromiseRef = React.useRef<Promise<cocossd.ObjectDetection> | null>(null)

  const frameRef = React.useRef<HTMLDivElement>(null)
  const imageRef = React.useRef<HTMLImageElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const objectUrlRef = React.useRef<string | null>(null)
  const latestDetectionsRef = React.useRef<Detection[]>([])
  const scanIdRef = React.useRef(0)

  const [status, setStatus] = React.useState(INITIAL_STATUS)
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [detections, setDetections] = React.useState<Detection[]>([])

  const syncCanvasSize = React.useCallback(() => {
    const frame = frameRef.current
    const canvas = canvasRef.current
    if (!frame || !canvas) return false

    const width = Math.floor(frame.clientWidth)
    const height = Math.floor(frame.clientHeight)
    if (width <= 0 || height <= 0) return false

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const nextWidth = Math.floor(width * dpr)
    const nextHeight = Math.floor(height * dpr)

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth
      canvas.height = nextHeight
    }

    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    return true
  }, [])

  const clearCanvas = React.useCallback(() => {
    const canvas = canvasRef.current
    const frame = frameRef.current
    if (!canvas || !frame) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, frame.clientWidth, frame.clientHeight)
  }, [])

  const drawDetections = React.useCallback(
    (items: Detection[]) => {
      const image = imageRef.current
      const canvas = canvasRef.current
      const frame = frameRef.current
      if (!image || !canvas || !frame) return

      const hasSize = syncCanvasSize()
      if (!hasSize) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.clearRect(0, 0, frame.clientWidth, frame.clientHeight)

      if (!image.naturalWidth || !image.naturalHeight || items.length === 0) {
        return
      }

      const containRect = getContainRect(
        image.naturalWidth,
        image.naturalHeight,
        frame.clientWidth,
        frame.clientHeight
      )

      const scaleX = containRect.width / image.naturalWidth
      const scaleY = containRect.height / image.naturalHeight

      for (const detection of items) {
        const [x, y, width, height] = detection.bbox

        const drawX = containRect.x + x * scaleX
        const drawY = containRect.y + y * scaleY
        const drawWidth = width * scaleX
        const drawHeight = height * scaleY

        const confidence = Math.round(detection.score * 100)
        const label = `${detection.class} ${confidence}%`

        ctx.save()

        ctx.strokeStyle = "rgba(244, 241, 235, 0.96)"
        ctx.lineWidth = 2.4
        ctx.shadowColor = "rgba(255, 255, 255, 0.35)"
        ctx.shadowBlur = 8
        ctx.strokeRect(drawX, drawY, drawWidth, drawHeight)

        ctx.shadowBlur = 0
        ctx.font = "700 12px Inter, sans-serif"
        ctx.textBaseline = "top"

        const labelPaddingX = 7
        const labelPaddingY = 5
        const labelHeight = 22
        const labelWidth = ctx.measureText(label).width + labelPaddingX * 2

        const labelX = Math.max(0, Math.min(drawX, frame.clientWidth - labelWidth))
        const labelY = Math.max(0, drawY - labelHeight - 4)

        ctx.fillStyle = "rgba(244, 241, 235, 0.96)"
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight)

        ctx.fillStyle = "#050505"
        ctx.fillText(label, labelX + labelPaddingX, labelY + labelPaddingY)

        ctx.restore()
      }
    },
    [syncCanvasSize]
  )

  const ensureModel = React.useCallback(async () => {
    if (modelRef.current) return modelRef.current

    if (!modelPromiseRef.current) {
      setStatus("Loading vision model...")
      modelPromiseRef.current = cocossd.load()
    }

    const model = await modelPromiseRef.current
    modelRef.current = model
    return model
  }, [])

  const runDetection = React.useCallback(async () => {
    const image = imageRef.current
    if (!image) return

    const currentScanId = ++scanIdRef.current

    try {
      const model = await ensureModel()

      if (currentScanId !== scanIdRef.current) return

      setStatus("Scanning image...")

      const rawDetections = await model.detect(image)

      if (currentScanId !== scanIdRef.current) return

      const filteredDetections = rawDetections
        .filter((item) => item.score >= MIN_CONFIDENCE)
        .sort((a, b) => b.score - a.score)

      latestDetectionsRef.current = filteredDetections
      setDetections(filteredDetections)
      drawDetections(filteredDetections)

      if (filteredDetections.length > 0) {
        setStatus(
          `Detected ${filteredDetections.length} object${
            filteredDetections.length === 1 ? "" : "s"
          }.`
        )
      } else {
        setStatus("No confident objects detected. Try a clearer everyday object photo.")
      }
    } catch {
      if (currentScanId === scanIdRef.current) {
        setStatus("Vision model failed to load.")
      }
    }
  }, [drawDetections, ensureModel])

  const handleImageLoad = React.useCallback(() => {
    void runDetection()
  }, [runDetection])

  const handleImageUpload = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      scanIdRef.current += 1

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }

      const objectUrl = URL.createObjectURL(file)

      objectUrlRef.current = objectUrl
      latestDetectionsRef.current = []
      setDetections([])
      setImageSrc(objectUrl)
      clearCanvas()
      setStatus("Preparing image scan...")
    },
    [clearCanvas]
  )

  const handleReset = React.useCallback(() => {
    scanIdRef.current += 1

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    setImageSrc(null)
    latestDetectionsRef.current = []
    setDetections([])
    setStatus(INITIAL_STATUS)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    clearCanvas()
  }, [clearCanvas])

  React.useEffect(() => {
    void ensureModel()
      .then(() => {
        setStatus((current) => (imageSrc ? current : INITIAL_STATUS))
      })
      .catch(() => {
        setStatus("Vision model failed to load.")
      })
  }, [ensureModel, imageSrc])

  React.useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const resizeObserver = new ResizeObserver(() => {
      const ok = syncCanvasSize()
      if (ok) {
        drawDetections(latestDetectionsRef.current)
      }
    })

    resizeObserver.observe(frame)

    return () => {
      resizeObserver.disconnect()
    }
  }, [drawDetections, syncCanvasSize])

  React.useEffect(() => {
    return () => {
      scanIdRef.current += 1

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  return (
    <div className="vision-scanner">
      <div className="vision-scanner__controls">
        <label className="vision-scanner__upload-button">
          Upload Image
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </label>

        <button
          className="vision-scanner__reset-button"
          onClick={handleReset}
          type="button"
        >
          Reset
        </button>
      </div>

      <div className="vision-scanner__frame" ref={frameRef}>
        {imageSrc ? (
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Uploaded for object detection"
            className="vision-scanner__image"
            onLoad={handleImageLoad}
          />
        ) : (
          <div className="vision-scanner__empty-state">
            <span>Awaiting image input</span>
            <small>Use a clear photo of everyday objects.</small>
          </div>
        )}

        <canvas ref={canvasRef} className="vision-scanner__overlay" />
      </div>

      <div className="vision-scanner__footer">
        <p className="vision-scanner__status">{status}</p>

        {detections.length > 0 && (
          <ul className="vision-scanner__detections">
            {detections.slice(0, 4).map((detection, index) => (
              <li key={`${detection.class}-${index}`}>
                {detection.class} {Math.round(detection.score * 100)}%
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}