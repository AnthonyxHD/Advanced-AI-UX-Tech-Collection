import * as React from "react"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { PLYLoader } from "three/addons/loaders/PLYLoader.js"

const STATUE_MODEL_URL =
  "https://threejs.org/examples/models/ply/binary/Lucy100k.ply"

const SPOTLIGHT_TEXTURE_URL =
  "https://threejs.org/examples/textures/disturb.jpg"

// Change this number if you want the statue smaller/larger.
// Smaller = more empty space around the statue.
// Bigger = statue fills more of the frame.
const STATUE_DISPLAY_HEIGHT = 2.65

export function StatueSpotlight() {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const fallbackRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x050505)
    scene.fog = new THREE.Fog(0x050505, 18, 42)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(4.8, 2.8, 5.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 1
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.minDistance = 3.8
    controls.maxDistance = 10
    controls.maxPolarAngle = Math.PI / 2.05
    controls.target.set(0, 1.35, 0)
    controls.update()

    if (fallbackRef.current) {
      fallbackRef.current.hidden = true
    }

    const ambient = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 0.28)
    scene.add(ambient)

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x101010,
      roughness: 0.96,
      metalness: 0,
    })

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.02
    floor.receiveShadow = true
    scene.add(floor)

    const backdrop = new THREE.Mesh(
      new THREE.CylinderGeometry(16, 16, 22, 48, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x050505,
        roughness: 1,
        metalness: 0,
        side: THREE.BackSide,
      })
    )
    backdrop.position.y = 5.5
    scene.add(backdrop)

    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.9, 2.4),
      new THREE.MeshStandardMaterial({
        color: 0x2a2625,
        roughness: 0.9,
        metalness: 0,
      })
    )
    pedestal.position.y = -0.58
    pedestal.castShadow = true
    pedestal.receiveShadow = true
    scene.add(pedestal)

    const pedestalCap = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.2, 2.8),
      new THREE.MeshStandardMaterial({
        color: 0x5f5650,
        roughness: 0.85,
        metalness: 0,
      })
    )
    pedestalCap.position.y = -0.05
    pedestalCap.castShadow = true
    pedestalCap.receiveShadow = true
    scene.add(pedestalCap)

    const spotLightTextureLoader = new THREE.TextureLoader()
    const spotlightTexture = spotLightTextureLoader.load(SPOTLIGHT_TEXTURE_URL)
    spotlightTexture.colorSpace = THREE.SRGBColorSpace
    spotlightTexture.minFilter = THREE.LinearFilter
    spotlightTexture.magFilter = THREE.LinearFilter
    spotlightTexture.generateMipmaps = false

    const spotLight = new THREE.SpotLight(0xffffff, 110)
    spotLight.name = "spotLight"
    spotLight.map = spotlightTexture
    spotLight.position.set(2.5, 5, 2.5)
    spotLight.angle = Math.PI / 6
    spotLight.penumbra = 1
    spotLight.decay = 2
    spotLight.distance = 0
    spotLight.castShadow = true
    spotLight.shadow.mapSize.width = 1024
    spotLight.shadow.mapSize.height = 1024
    spotLight.shadow.camera.near = 2
    spotLight.shadow.camera.far = 10
    spotLight.shadow.focus = 1
    spotLight.shadow.bias = -0.003
    spotLight.shadow.intensity = 1
    scene.add(spotLight)
    scene.add(spotLight.target)

    const spotLightHelper = new THREE.SpotLightHelper(spotLight)
    spotLightHelper.visible = false
    scene.add(spotLightHelper)

    const rimLight = new THREE.DirectionalLight(0xf7d9b3, 0.35)
    rimLight.position.set(-6, 4, -2)
    scene.add(rimLight)

    const keyLight = new THREE.PointLight(0xffffff, 18, 18)
    keyLight.position.set(-2.5, 3.5, 3.5)
    keyLight.castShadow = true
    scene.add(keyLight)

    const statueGroup = new THREE.Group()
    statueGroup.position.set(0, 0, 0)
    scene.add(statueGroup)

    const statueMaterial = new THREE.MeshLambertMaterial({ color: 0xd9d4ca })

    const fitCameraToStatue = () => {
      const target = new THREE.Vector3(0, 1.35, 0)

      controls.target.copy(target)

      // Distance calculated so the whole statue is visible at first load.
      const fov = THREE.MathUtils.degToRad(camera.fov)
      const distance = STATUE_DISPLAY_HEIGHT / (2 * Math.tan(fov / 2)) * 1.85

      camera.position.set(distance * 0.85, distance * 0.5, distance * 1.05)
      camera.lookAt(target)

      controls.minDistance = distance * 0.55
      controls.maxDistance = distance * 2.6
      controls.update()
    }

    const loadStatue = async () => {
      const loader = new PLYLoader()

      try {
        const geometry = await loader.loadAsync(STATUE_MODEL_URL)

        geometry.computeBoundingBox()

        const box = geometry.boundingBox
        if (!box) return

        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())

        // Center the model horizontally and put its feet/base at y = 0.
        geometry.translate(-center.x, -box.min.y, -center.z)

        // Scale automatically based on actual model height.
        const scale = STATUE_DISPLAY_HEIGHT / size.y

        geometry.computeVertexNormals()

        const mesh = new THREE.Mesh(geometry, statueMaterial)
        mesh.scale.setScalar(scale)
        mesh.rotation.y = -Math.PI / 2

        // Pedestal cap top is roughly y = 0.05, so the statue sits on it.
        mesh.position.y = 0.06

        mesh.castShadow = true
        mesh.receiveShadow = true
        statueGroup.add(mesh)

        const statueTarget = new THREE.Vector3(0, 1.35, 0)
        spotLight.target.position.copy(statueTarget)
        spotLight.target.updateMatrixWorld()

        fitCameraToStatue()
      } catch {
        const fallback = createFallbackStatue(statueMaterial)
        fallback.scale.setScalar(0.85)
        statueGroup.add(fallback)

        spotLight.target.position.set(0, 1.2, 0)
        fitCameraToStatue()
      }
    }

    void loadStatue()

    const resizeRenderer = () => {
      const width = container.clientWidth
      const height = container.clientHeight

      if (width === 0 || height === 0) return

      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    resizeRenderer()

    const resizeObserver = new ResizeObserver(() => {
      resizeRenderer()
    })

    resizeObserver.observe(container)

    let frameId = 0
    const clock = new THREE.Clock()

    const animate = () => {
      const elapsed = clock.getElapsedTime()

      controls.update()

      spotLight.position.x = 2.5 + Math.sin(elapsed * 0.4) * 0.75
      spotLight.position.z = 2.5 + Math.cos(elapsed * 0.32) * 0.5
      spotLightHelper.update()

      statueGroup.rotation.y = Math.sin(elapsed * 0.18) * 0.12

      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.dispose()
      spotlightTexture.dispose()

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()

          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="statue-spotlight" ref={containerRef}>
      <div className="statue-stage__fallback" ref={fallbackRef}>
        Loading statue...
      </div>
    </div>
  )
}

function createFallbackStatue(material: THREE.Material) {
  const group = new THREE.Group()

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.1, 1.1, 32), material)
  base.position.y = -0.4
  base.castShadow = true
  base.receiveShadow = true
  group.add(base)

  const shoulders = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.22, 16, 48), material)
  shoulders.rotation.x = Math.PI / 2
  shoulders.scale.set(1.08, 0.92, 0.86)
  shoulders.position.y = 0.55
  shoulders.castShadow = true
  group.add(shoulders)

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 1.5, 30), material)
  torso.position.y = 0.1
  torso.castShadow = true
  torso.receiveShadow = true
  group.add(torso)

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.34, 24), material)
  neck.position.y = 1.0
  neck.castShadow = true
  group.add(neck)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.63, 36, 28), material)
  head.scale.set(0.9, 1.05, 0.86)
  head.position.y = 1.58
  head.castShadow = true
  group.add(head)

  return group
}