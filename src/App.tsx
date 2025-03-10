import './App.css'
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Outlines, Environment, useTexture } from "@react-three/drei"
import { Physics, useSphere } from "@react-three/cannon"
import { EffectComposer, N8AO, SMAA } from "@react-three/postprocessing"
import { useControls } from "leva"
import { Ref } from 'react'

const rfs = THREE.MathUtils.randFloatSpread
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
const baubleMaterial = new THREE.MeshStandardMaterial({ color: "white", roughness: 0, envMapIntensity: 1 })

function App() {
  return (
    <Canvas shadows gl={{ antialias: false }} dpr={[1, 1.5]} camera={{ position: [0, 0, 20], fov: 35, near: 1, far: 40 }}>
      <ambientLight intensity={0.5} />
      <color attach="background" args={["#dfdfdf"]} />
      <spotLight intensity={1} angle={0.2} penumbra={1} position={[30, 30, 30]} castShadow shadow-mapSize={[512, 512]} />
      <Physics gravity={[0, 2, 0]} iterations={10}>
        <Pointer />
        <Clump />
      </Physics>
      <Environment files={import.meta.env.BASE_URL + "adamsbridge.hdr"} />
      <EffectComposer enableNormalPass multisampling={0}>
        <N8AO halfRes color="black" aoRadius={2} intensity={1} aoSamples={6} denoiseSamples={4} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  )
}

function Clump({ mat = new THREE.Matrix4(), vec = new THREE.Vector3() }) {
  const { outlines } = useControls({ outlines: { value: 0.0, step: 0.01, min: 0, max: 0.05 } });
  console.log("import.meta.env.BASE_URL", import.meta.env.BASE_URL)
  const texture = useTexture(import.meta.env.BASE_URL + "openhuman.jpg");
  const mesh = useSphere(() => ({
    args: [1],
    mass: 1,
    angularDamping: 0.1,
    linearDamping: 0.65,
    position: [rfs(20), rfs(20), rfs(20)],
  }));

  const [ref, api] = mesh;

  useFrame(() => {
    if (ref.current) {
      const refVal: THREE.InstancedMesh<any, any, any> = ref.current as any;
      for (let i = 0; i < 40; i++) {
        // Get current whereabouts of the instanced sphere
        refVal.getMatrixAt(i, mat);
        // Normalize the position and multiply by a negative force.
        // This is enough to drive it towards the center-point.
        api.at(i).applyForce(vec.setFromMatrixPosition(mat).normalize().multiplyScalar(-40).toArray(), [0, 0, 0]);
      }
    }

  });

  return (
    <instancedMesh ref={ref as Ref<THREE.InstancedMesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.InstancedMeshEventMap>>} castShadow receiveShadow args={[sphereGeometry, baubleMaterial, 40]} material-map={texture}>
      <Outlines thickness={outlines} />
    </instancedMesh>
  );
}

function Pointer() {
  const viewport = useThree((state) => state.viewport)
  const [, api] = useSphere(() => ({ type: "Kinematic", args: [3], position: [0, 0, 0] }))
  return useFrame((state) => api.position.set((state.mouse.x * viewport.width) / 2, (state.mouse.y * viewport.height) / 2, 0))
}

export default App
