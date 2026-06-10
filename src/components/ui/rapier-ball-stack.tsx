import * as React from "react"
import RAPIER from "@dimforge/rapier3d-compat"
import * as THREE from "three"

const FLOOR_HALF_EXTENT = 8
const BALL_RADIUS = 0.24
const MAX_BALLS = 220

type BallEntry = {
  mesh: THREE.Mesh
  body: RAPIER.RigidBody
}

export function RapierBallStack() {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const fallbackRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let isDisposed = false

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
    camera.position.set(0, 6, 10)
    camera.lookAt(0, 1.4, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 0.55)
    scene.add(ambient)

    const key = new THREE.DirectionalLight(0xffffff, 0.85)
    key.position.set(5, 10, 4)
    scene.add(key)

    const fill = new THREE.DirectionalLight(0xffffff, 0.45)
    fill.position.set(-6, 5, -3)
    scene.add(fill)

    const floorGeometry = new THREE.PlaneGeometry(
      FLOOR_HALF_EXTENT * 2,
      FLOOR_HALF_EXTENT * 2
    )
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.92,
      metalness: 0,
    })
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
    floorMesh.rotation.x = -Math.PI / 2
    floorMesh.position.y = 0
    scene.add(floorMesh)

    const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 24, 24)
    const ballMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0,
    })

    let physicsWorld: RAPIER.World | null = null
    const balls: BallEntry[] = []

    const raycaster = new THREE.Raycaster()
    const pointerNdc = new THREE.Vector2()
    const spawnPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const spawnPoint = new THREE.Vector3(0, 0, 0)

    const resizeRenderer = () => {
      const width = container.clientWidth
      const height = container.clientHeight

      if (width === 0 || height === 0) return

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const removeOldestBall = () => {
      const oldest = balls.shift()
      if (!oldest || !physicsWorld) return

      scene.remove(oldest.mesh)
      oldest.mesh.geometry.dispose()
      physicsWorld.removeRigidBody(oldest.body)
    }

    const spawnBall = (worldX: number, worldZ: number) => {
      if (!physicsWorld) return

      if (balls.length >= MAX_BALLS) {
        removeOldestBall()
      }

      const clampedX = THREE.MathUtils.clamp(
        worldX,
        -FLOOR_HALF_EXTENT + BALL_RADIUS,
        FLOOR_HALF_EXTENT - BALL_RADIUS
      )
      const clampedZ = THREE.MathUtils.clamp(
        worldZ,
        -FLOOR_HALF_EXTENT + BALL_RADIUS,
        FLOOR_HALF_EXTENT - BALL_RADIUS
      )

      const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
        clampedX,
        6,
        clampedZ
      )
      const body = physicsWorld.createRigidBody(rigidBodyDesc)

      const colliderDesc = RAPIER.ColliderDesc.ball(BALL_RADIUS)
        .setDensity(1)
        .setRestitution(0.1)
        .setFriction(0.85)
      physicsWorld.createCollider(colliderDesc, body)

      const mesh = new THREE.Mesh(ballGeometry.clone(), ballMaterial)
      mesh.position.set(clampedX, 6, clampedZ)
      scene.add(mesh)

      balls.push({ mesh, body })
    }

    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const localX = event.clientX - rect.left
      const localY = event.clientY - rect.top

      pointerNdc.x = (localX / rect.width) * 2 - 1
      pointerNdc.y = -(localY / rect.height) * 2 + 1

      raycaster.setFromCamera(pointerNdc, camera)

      if (raycaster.ray.intersectPlane(spawnPlane, spawnPoint)) {
        spawnBall(spawnPoint.x, spawnPoint.z)
      }
    }

    let frameId = 0
    const fixedStep = 1 / 60
    let previousTimestamp = performance.now()
    let accumulator = 0

    const animate = (timestamp: number) => {
      if (isDisposed) return

      const delta = Math.min(0.1, (timestamp - previousTimestamp) / 1000)
      previousTimestamp = timestamp
      accumulator += delta

      if (physicsWorld) {
        while (accumulator >= fixedStep) {
          physicsWorld.step()
          accumulator -= fixedStep
        }

        for (const entry of balls) {
          const position = entry.body.translation()
          const rotation = entry.body.rotation()

          entry.mesh.position.set(position.x, position.y, position.z)
          entry.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
        }
      }

      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(animate)
    }

    const init = async () => {
      try {
        await RAPIER.init()
        if (isDisposed) return

        physicsWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 })

        // Collider only: floor is invisible but catches all falling balls.
        const floorColliderDesc = RAPIER.ColliderDesc.cuboid(
          FLOOR_HALF_EXTENT,
          0.14,
          FLOOR_HALF_EXTENT
        ).setTranslation(0, -0.14, 0)
        physicsWorld.createCollider(floorColliderDesc)

        if (fallbackRef.current) {
          fallbackRef.current.hidden = true
        }

        resizeRenderer()
        renderer.domElement.addEventListener("pointerdown", onPointerDown)
        frameId = window.requestAnimationFrame(animate)
      } catch {
        if (fallbackRef.current) {
          fallbackRef.current.hidden = false
          fallbackRef.current.textContent = "Physics failed to load"
        }
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      resizeRenderer()
    })
    resizeObserver.observe(container)

    void init()

    return () => {
      isDisposed = true
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener("pointerdown", onPointerDown)

      for (const entry of balls) {
        scene.remove(entry.mesh)
        entry.mesh.geometry.dispose()
      }

      floorGeometry.dispose()
      floorMaterial.dispose()
      ballGeometry.dispose()
      ballMaterial.dispose()
      renderer.dispose()

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }

      physicsWorld?.free()
      physicsWorld = null
    }
  }, [])

  return (
    <div className="rapier-ball-stack" ref={containerRef}>
      <div className="rapier-ball-stack__fallback" ref={fallbackRef}>
        Initializing physics...
      </div>
    </div>
  )
}
