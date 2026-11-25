import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import { Box3, MathUtils, Vector3 } from 'three'
import { SELECTED_LIFT, SELECTED_Z } from './Bottle'

export const FOV = 35

/** What the camera frames: a whole shelf (board top at `y`) or one selected bottle on it. */
export type Focus = { kind: 'shelf'; y: number; width: number } | { kind: 'bottle'; x: number; y: number; h: number }

export function CameraRig({ focus }: { focus: Focus }) {
  const controls = useRef<CameraControls>(null)
  const { size } = useThree()
  const key = JSON.stringify(focus)

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const aspect = size.width / size.height
    const halfV = MathUtils.degToRad(FOV / 2)
    const halfH = Math.atan(Math.tan(halfV) * aspect)

    if (focus.kind === 'bottle') {
      const { x, y, h } = focus
      const desktop = size.width >= 768
      const cy = y + SELECTED_LIFT + h / 2
      const dist = (h * 0.75) / Math.tan(halfV) + 0.6
      // On desktop the detail panel covers the right side, so aim right of the bottle.
      const tx = desktop ? x + dist * Math.tan(halfH) * 0.38 : x
      const ty = desktop ? cy : cy - h * 0.35
      c.setBoundary()
      c.setLookAt(tx, ty + 0.25, SELECTED_Z + dist, tx, ty, SELECTED_Z, true)
      return
    }

    // Whole shelf on wide screens; on narrow ones (or very long shelves) fit part of it and let the user pan.
    const { y, width } = focus
    const fitWidth = aspect >= 1 ? Math.min(width + 1.2, 26) : 4
    const dist = Math.max(fitWidth / 2 / Math.tan(halfH), 4)
    const slack = Math.max(0, width / 2 - fitWidth / 2)
    c.setBoundary(new Box3(new Vector3(-slack, y + 0.4, -0.6), new Vector3(slack, y + 1.4, 0)))
    c.setLookAt(0, y + 1.35, dist - 0.3, 0, y + 0.8, -0.3, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, size.width, size.height])

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={0.45}
      minDistance={1.2}
      maxDistance={40}
      minPolarAngle={MathUtils.degToRad(55)}
      maxPolarAngle={MathUtils.degToRad(95)}
      minAzimuthAngle={MathUtils.degToRad(-40)}
      maxAzimuthAngle={MathUtils.degToRad(40)}
      boundaryEnclosesCamera={false}
    />
  )
}
