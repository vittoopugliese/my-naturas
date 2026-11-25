import { Environment, Lightformer } from '@react-three/drei'

/**
 * Room around the shelves: background, back wall, lights and glass reflections.
 * `y` is the height of the shelf in focus, so the top light follows the camera between shelves.
 */
export function Stage({ y = 0, wallTop = 8, wallBottom = -4 }: { y?: number; wallTop?: number; wallBottom?: number }) {
  return (
    <>
      <color attach="background" args={['#120d0a']} />
      <fog attach="fog" args={['#120d0a', 22, 60]} />

      <ambientLight intensity={0.25} />
      <spotLight position={[0, y + 6, 4]} angle={0.75} penumbra={1} intensity={140} color="#ffe8cc" />
      <pointLight position={[-5, y + 2.4, 2]} intensity={6} color="#ffd2a0" />
      <pointLight position={[5, y + 2.4, 2]} intensity={6} color="#ffd2a0" />

      {/* Reflections for the glass. Built locally, so no HDR download. */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 5, 2]} scale={[10, 2, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2} position={[-5, 1, 3]} scale={[2, 6, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2} position={[5, 1, 3]} scale={[2, 6, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={1.5} color="#ffcf9a" position={[0, 1, 6]} scale={3} />
      </Environment>

      <mesh position={[0, (wallTop + wallBottom) / 2, -0.95]}>
        <planeGeometry args={[80, wallTop - wallBottom]} />
        <meshStandardMaterial color="#21160f" roughness={0.95} />
      </mesh>
    </>
  )
}
