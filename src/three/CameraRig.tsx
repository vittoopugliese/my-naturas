import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { Box3, MathUtils, Vector3 } from 'three'
import { SELECTED_LIFT, SELECTED_Z } from './Bottle'

export const FOV = 35

const { ACTION } = CameraControlsImpl

/**
 * What the camera frames: a whole shelf (board top at `y`) or one selected bottle on it.
 * On a shelf, `x` is where to look along it (clamped to the shelf); change `nonce` to re-aim at the same x.
 */
export type Focus =
  | { kind: 'shelf'; y: number; width: number; x?: number; nonce?: number }
  | { kind: 'bottle'; x: number; y: number; h: number }

type Props = {
  focus: Focus
  /** Phone layout: one finger slides along the shelf, and the camera stays still while a bottle is open. */
  compact?: boolean
  /** Called while the camera moves, with the x it looks at. */
  onLook?: (x: number) => void
  /** Called once when the user starts to drag or pinch. */
  onUserMove?: () => void
}

/** How much of the shelf a narrow screen shows at once. */
const COMPACT_FIT = 5.2

export function CameraRig({ focus, compact = false, onLook, onUserMove }: Props) {
  const controls = useRef<CameraControls>(null)
  const target = useRef(new Vector3())
  const { size } = useThree()
  const key = JSON.stringify(focus)

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const aspect = size.width / size.height
    const halfV = MathUtils.degToRad(FOV / 2)
    const halfH = Math.atan(Math.tan(halfV) * aspect)

    // Touch: on phones one finger slides along the shelf (like scrolling) and two fingers zoom.
    // On larger screens one finger turns the view, as with the mouse.
    c.touches.one = compact ? ACTION.TOUCH_TRUCK : ACTION.TOUCH_ROTATE
    c.touches.two = compact ? ACTION.TOUCH_DOLLY_TRUCK : ACTION.TOUCH_DOLLY_ROTATE
    c.mouseButtons.left = compact ? ACTION.TRUCK : ACTION.ROTATE

    if (focus.kind === 'bottle') {
      const { x, y, h } = focus
      const cy = y + SELECTED_LIFT + h / 2
      // On phones the detail sheet covers the bottom half and the title the top: the bottle takes
      // about 28% of the screen height, centered in the band between them (~31% from the top).
      const dist = compact ? h / (0.56 * Math.tan(halfV)) : (h * 0.75) / Math.tan(halfV) + 0.6
      // On desktop the detail panel covers the right side, so aim right of the bottle.
      const tx = compact ? x : x + dist * Math.tan(halfH) * 0.38
      const ty = compact ? cy - 0.38 * dist * Math.tan(halfV) : cy
      // While a bottle is open on a phone, swipes go to prev / next instead of the camera.
      c.enabled = !compact
      c.setBoundary()
      c.setLookAt(tx, ty + 0.25, SELECTED_Z + dist, tx, ty, SELECTED_Z, true)
      return
    }

    c.enabled = true
    // Whole shelf on wide screens; on narrow ones (or very long shelves) fit part of it and let the user pan.
    const { y, width } = focus
    const fitWidth = aspect >= 1 ? Math.min(width + 1.2, 26) : COMPACT_FIT
    const dist = Math.max(fitWidth / 2 / Math.tan(halfH), 4)
    // Phones keep a little room past the end bottles, so the first and last ones are never cut off.
    const slack = Math.max(0, width / 2 - fitWidth * (compact ? 0.38 : 0.5))
    const x = MathUtils.clamp(focus.x ?? 0, -slack, slack)
    c.setBoundary(new Box3(new Vector3(-slack, y + 0.4, -0.6), new Vector3(slack, y + 1.4, 0)))
    c.setLookAt(x, y + 1.35, dist - 0.3, x, y + 0.8, -0.3, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, size.width, size.height, compact])

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={0.45}
      draggingSmoothTime={0.08}
      minDistance={1.2}
      maxDistance={40}
      minPolarAngle={MathUtils.degToRad(55)}
      maxPolarAngle={MathUtils.degToRad(95)}
      minAzimuthAngle={MathUtils.degToRad(-40)}
      maxAzimuthAngle={MathUtils.degToRad(40)}
      boundaryEnclosesCamera={false}
      onControlStart={onUserMove}
      onUpdate={() => onLook?.(controls.current!.getTarget(target.current).x)}
    />
  )
}
