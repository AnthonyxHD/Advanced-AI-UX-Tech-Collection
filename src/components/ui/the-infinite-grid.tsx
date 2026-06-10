import React, { useEffect, useId, useRef } from "react";
import {
  motion,
  MotionValue,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";

export const Component = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  useEffect(() => {
    const updateMousePosition = (event: PointerEvent) => {
      const element = containerRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();

      mouseX.set(event.clientX - rect.left);
      mouseY.set(event.clientY - rect.top);
    };

    window.addEventListener("pointermove", updateMousePosition);

    return () => {
      window.removeEventListener("pointermove", updateMousePosition);
    };
  }, [mouseX, mouseY]);

  useAnimationFrame((_time, delta) => {
    const speed = 0.018;

    gridOffsetX.set((gridOffsetX.get() + delta * speed) % 40);
    gridOffsetY.set((gridOffsetY.get() + delta * speed) % 40);
  });

  const maskImage = useMotionTemplate`
    radial-gradient(
      260px circle at ${mouseX}px ${mouseY}px,
      black 0%,
      rgba(0, 0, 0, 0.9) 28%,
      rgba(0, 0, 0, 0.45) 52%,
      transparent 78%
    )
  `;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none bg-[#050505]"
    >
      {/* Very subtle base grid */}
      <div className="absolute inset-0 z-0 opacity-[0.07] text-white">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </div>

      {/* Strong white grid around the mouse */}
      <motion.div
        className="absolute inset-0 z-0 opacity-90 text-white"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </motion.div>

    </div>
  );
};

const GridPattern = ({
  offsetX,
  offsetY,
}: {
  offsetX: MotionValue<number>;
  offsetY: MotionValue<number>;
}) => {
  const id = useId();

  return (
    <svg className="h-full w-full">
      <defs>
        <motion.pattern
          id={id}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </motion.pattern>
      </defs>

      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};