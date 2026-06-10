import "./App.css"

import * as React from "react"

import { Component as InfiniteGrid } from "@/components/ui/the-infinite-grid"
import { MagicCard } from "@/components/ui/magic-card"
import { MultipleCanvasesDemo } from "@/components/ui/multiple-canvases-demo"
import { RapierBallStack } from "@/components/ui/rapier-ball-stack"
import { StatueSpotlight } from "@/components/ui/statue-spotlight"
import { SpinningText } from "@/components/ui/spinning-text"
import { VisionScanner } from "@/components/ui/vision-scanner"

export default function App() {
  return (
    <>
      <main className="page-shell">
        <section className="viewport" id="top">
          <div className="imported-grid-layer" aria-hidden="true">
            <InfiniteGrid />
          </div>

          <nav className="navbar" aria-label="Primary navigation">
            <MagicCard
              mode="gradient"
              className="navbar-magic"
              gradientSize={230}
              gradientColor="rgba(239, 68, 68, 0.34)"
              gradientOpacity={0.55}
              gradientFrom="rgba(248, 113, 113, 0.72)"
              gradientTo="rgba(127, 29, 29, 0.08)"
            >
              <div className="navbar-inner">
                <a className="logo" href="#top">
                  Anthony Zoss
                </a>

                <ul className="nav-links">
                  <li>
                    <a href="#top">Module 00</a>
                  </li>
                  <li>
                    <a href="#modules">Module 01</a>
                  </li>
                  <li>
                    <a href="#multiple-canvases">Module 02</a>
                  </li>
                  <li>
                    <a href="#module-03">Module 03</a>
                  </li>
                </ul>
              </div>
            </MagicCard>
          </nav>

          <section className="hero-content" aria-labelledby="hero-title">
            <p className="module-stage__eyebrow hero-eyebrow">Module 00</p>
            <h1 className="hero-title" id="hero-title">
              Tech-Components
              <br />
              Collection
            </h1>
          </section>

          <a
            className="scroll-spinner"
            href="#modules"
            aria-label="Scroll to learn more"
          >
            <SpinningText
              duration={28}
              radius={5.2}
              className="scroll-spinner__text"
            >
              Scroll to Learn More • Scroll to Learn More •
            </SpinningText>

            <span className="scroll-spinner__dot" aria-hidden="true" />
          </a>
        </section>
      </main>

      <section
        className="module-stage"
        id="modules"
        aria-labelledby="module-1-title"
      >
        <div className="module-stage__copy">
          <p className="module-stage__eyebrow">Module 01</p>
          <h2 className="module-stage__title" id="module-1-title">
            3D-Object &amp; Lighting Spotlight
          </h2>
          <p className="module-stage__text">
            A Three.js statue inside the frame. Drag to rotate it, and zoom in or out
            for a closer look.
          </p>

          <ul className="module-stage__chips" aria-label="Technologies for Module 1">
            <li>Three.js</li>
            <li>Lighting</li>
            <li>Orbit Controls</li>
          </ul>
        </div>

        <div className="statue-stage" aria-label="Three.js statue frame">
          <StatueSpotlight />
        </div>
      </section>

      <section
        className="page-shell page-shell--empty-frame"
        aria-labelledby="module-2-title"
      >
        <div className="module-stage__copy physics-stage__copy">
          <p className="module-stage__eyebrow">Module 01</p>
          <h2 className="module-stage__title physics-stage__title" id="module-2-title">
            Interactive Physics Stack
          </h2>
          <p className="module-stage__text">
            Click inside the frame to spawn a ball. Gravity pulls it down onto the
            floor, so over time your drops build a stacked structure.
          </p>
        </div>

        <div className="viewport viewport--outline" aria-label="Rapier physics frame">
          <RapierBallStack />
        </div>

        <ul className="module-stage__chips physics-stage__chips" aria-label="Technologies for Module 2">
          <li>Rapier</li>
          <li>Three.js</li>
          <li>Rigid Bodies</li>
        </ul>
      </section>

      <section
        className="page-shell page-shell--empty-frame"
        id="multiple-canvases"
        aria-labelledby="module-2-multiple-title"
      >
        <div className="module-stage__copy physics-stage__copy">
          <p className="module-stage__eyebrow">Module 02</p>
          <h2
            className="module-stage__title physics-stage__title"
            id="module-2-multiple-title"
          >
            Multiple Canvases
          </h2>
          <p className="module-stage__text">
            Two independent p5.js canvases. Move your mouse at different speeds to draw and click around.
          </p>
        </div>

        <div
          className="viewport viewport--outline viewport--placeholder"
          aria-label="Multiple canvases frame"
        >
          <MultipleCanvasesDemo />
        </div>

        <ul
          className="module-stage__chips physics-stage__chips"
          aria-label="Technologies for Module 2 placeholders"
        >
          <li>p5.js</li>
          <li>Instance Mode</li>
          <li>Interactive Drawing</li>
        </ul>
      </section>

      <section
        className="module-stage"
        id="module-03"
        aria-labelledby="module-3-title"
      >
        <div className="module-stage__copy">
          <p className="module-stage__eyebrow">Module 03</p>
          <h2 className="module-stage__title" id="module-3-title">
            Multimodal Vision
          </h2>
          <p className="module-stage__text">
            Upload an image to run object detection. The frame shows detected objects
            with minimal bounding boxes and confidence labels.
          </p>

          <ul className="module-stage__chips" aria-label="Technologies for Module 3">
            <li>TensorFlow.js</li>
            <li>COCO-SSD</li>
            <li>Object Detection</li>
          </ul>
        </div>

        <div className="module-stage__frame-placeholder" aria-label="Module 3 placeholder frame">
          <VisionScanner />
        </div>
      </section>
    </>
  )
}
