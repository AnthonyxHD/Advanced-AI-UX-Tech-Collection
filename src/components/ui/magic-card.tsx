import * as React from "react"
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  type HTMLMotionProps,
} from "motion/react"

import { cn } from "@/lib/utils"

type MagicCardProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: React.ReactNode
  mode?: "gradient"
  gradientSize?: number
  gradientColor?: string
  gradientOpacity?: number
  gradientFrom?: string
  gradientTo?: string
}

export function MagicCard({
  children,
  className,
  style,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  mode = "gradient",
  gradientSize = 180,
  gradientColor = "#ffffff",
  gradientOpacity = 0.22,
  gradientFrom = "rgba(255, 255, 255, 0.55)",
  gradientTo = "rgba(255, 255, 255, 0.08)",
  ...props
}: MagicCardProps) {
  const mouseX = useMotionValue(-gradientSize)
  const mouseY = useMotionValue(-gradientSize)

  const resetMouse = React.useCallback(() => {
    mouseX.set(-gradientSize)
    mouseY.set(-gradientSize)
  }, [mouseX, mouseY, gradientSize])

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()

      mouseX.set(event.clientX - rect.left)
      mouseY.set(event.clientY - rect.top)

      onPointerMove?.(event)
    },
    [mouseX, mouseY, onPointerMove]
  )

  const borderBackground = useMotionTemplate`
    linear-gradient(var(--magic-card-bg, rgba(255, 255, 255, 0.08)) 0 0) padding-box,
    radial-gradient(
      ${gradientSize}px circle at ${mouseX}px ${mouseY}px,
      ${gradientFrom},
      ${gradientTo},
      transparent 75%
    ) border-box
  `

  const glowBackground = useMotionTemplate`
    radial-gradient(
      ${gradientSize}px circle at ${mouseX}px ${mouseY}px,
      ${gradientColor},
      transparent 72%
    )
  `

  return (
    <motion.div
      {...props}
      className={cn(
        "group relative isolate h-full w-full overflow-hidden rounded-[inherit] border border-transparent",
        className
      )}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={(event) => {
        resetMouse()
        onPointerLeave?.(event)
      }}
      style={{
        ...style,
        background: borderBackground,
      }}
    >
      <div className="absolute inset-px z-0 rounded-[inherit] bg-[var(--magic-card-bg,rgba(255,255,255,0.08))]" />

      {mode === "gradient" && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-px z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: glowBackground,
            opacity: gradientOpacity,
          }}
        />
      )}

      <div className="relative z-20 h-full w-full">{children}</div>
    </motion.div>
  )
}