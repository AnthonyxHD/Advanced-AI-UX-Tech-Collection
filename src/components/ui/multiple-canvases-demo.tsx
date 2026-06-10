import * as React from "react"
import p5 from "p5"

type DrawablePoint = {
  x: number
  y: number
  size: number
}

type DrawableSquare = {
  x: number
  y: number
  size: number
  rotation: number
}

const CANVAS_GAP = 16

export function MultipleCanvasesDemo() {
  const hostRef = React.useRef<HTMLDivElement>(null)
  const topCanvasMountRef = React.useRef<HTMLDivElement>(null)
  const bottomCanvasMountRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const host = hostRef.current
    const topMount = topCanvasMountRef.current
    const bottomMount = bottomCanvasMountRef.current

    if (!host || !topMount || !bottomMount) return

    const getSketchSize = () => {
      const width = Math.max(220, Math.floor(host.clientWidth))
      const height = Math.max(120, Math.floor((host.clientHeight - CANVAS_GAP) / 2))

      return { width, height }
    }

    const isInsideCanvas = (p: p5) =>
      p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height

    const sketch1 = (p: p5) => {
      let points: DrawablePoint[] = []

      const drawBackground = () => {
        p.background(0)
      }

      const addPoint = () => {
        if (!isInsideCanvas(p)) return

        points.push({
          x: p.mouseX,
          y: p.mouseY,
          size: 18 + Math.sin(p.frameCount * 0.08) * 8,
        })

        if (points.length > 420) {
          points = points.slice(points.length - 420)
        }
      }

      p.setup = () => {
        const { width, height } = getSketchSize()
        const canvas = p.createCanvas(width, height)
        canvas.parent(topMount)

        p.noStroke()
        drawBackground()
      }

      p.draw = () => {
        drawBackground()

        p.noStroke()

        points.forEach((point, index) => {
          const alpha = p.map(index, 0, Math.max(points.length - 1, 1), 60, 210)

          p.fill(244, 241, 235, alpha)
          p.circle(point.x, point.y, point.size)
        })
      }

      p.mouseMoved = () => {
        addPoint()
      }

      p.mouseDragged = () => {
        addPoint()
      }

      p.windowResized = () => {
        const { width, height } = getSketchSize()

        p.resizeCanvas(width, height)
        drawBackground()
      }
    }

    const sketch2 = (p: p5) => {
      let squares: DrawableSquare[] = []

      const drawBackground = () => {
        p.background(120)
      }

      const addSquare = () => {
        if (!isInsideCanvas(p)) return

        squares.push({
          x: p.mouseX,
          y: p.mouseY,
          size: 20 + Math.cos(p.frameCount * 0.06) * 9,
          rotation: p.frameCount * 0.025,
        })

        if (squares.length > 380) {
          squares = squares.slice(squares.length - 380)
        }
      }

      p.setup = () => {
        const { width, height } = getSketchSize()
        const canvas = p.createCanvas(width, height)
        canvas.parent(bottomMount)

        p.rectMode(p.CENTER)
        drawBackground()
      }

      p.draw = () => {
        drawBackground()

        p.noFill()

        squares.forEach((square, index) => {
          const alpha = p.map(index, 0, Math.max(squares.length - 1, 1), 45, 190)

          p.push()
          p.translate(square.x, square.y)
          p.rotate(square.rotation + index * 0.025)
          p.stroke(20, 20, 20, alpha)
          p.strokeWeight(1.4)
          p.square(0, 0, square.size)
          p.pop()
        })
      }

      p.mouseMoved = () => {
        addSquare()
      }

      p.mouseDragged = () => {
        addSquare()
      }

      p.windowResized = () => {
        const { width, height } = getSketchSize()

        p.resizeCanvas(width, height)
        drawBackground()
      }
    }

    const topSketch = new p5(sketch1)
    const bottomSketch = new p5(sketch2)

    const resizeObserver = new ResizeObserver(() => {
      topSketch.windowResized?.()
      bottomSketch.windowResized?.()
    })

    resizeObserver.observe(host)

    return () => {
      resizeObserver.disconnect()
      topSketch.remove()
      bottomSketch.remove()
    }
  }, [])

  return (
    <div className="multiple-canvases-demo" ref={hostRef}>
      <div className="multiple-canvases-demo__canvas" ref={topCanvasMountRef} />
      <div className="multiple-canvases-demo__canvas" ref={bottomCanvasMountRef} />
    </div>
  )
}