import { useMemo } from 'react'
import { Color, type Texture } from 'three'
import { Text } from '@react-three/drei'
import type { ReactNode } from 'react'
import type { Finish } from '../types'
import { gradientTextures } from './textures'

/** Relative luminance of a hex color, in linear space. */
export function luminance(hex: string) {
  const c = new Color(hex)
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
}

export function isSilver(hex: string) {
  const c = new Color(hex)
  return luminance(hex) > 0.3 && Math.abs(c.r - c.b) < 0.08
}

type GlassProps = {
  color: string
  /** Bottom color: the bottle fades from `color` (top) to clear glass. Needs vertical UVs. */
  gradientTo?: string
  finish?: Finish
  tint?: string
}

/**
 * Bottle glass. Every bottle material is `transparent` so the shelf can fade it with `opacity`.
 * - matte: coated, opaque (Essencial).
 * - near-black: glossy lacquer.
 * - gradientTo: colored top fading to clear bottom (Tato, Elo, Kaiak).
 * - otherwise: glass and liquid as one tinted volume. Partial transmission plus a faint
 *   self-glow keeps the color saturated against the dark wall; pale bottles stay clear.
 */
export function Glass({ color, gradientTo, finish = 'gloss', tint }: GlassProps) {
  const textures = useMemo(() => (gradientTo ? gradientTextures(color, gradientTo) : null), [color, gradientTo])
  const roughness = finish === 'frosted' ? 0.32 : 0.05
  const lum = luminance(color)

  if (finish === 'matte') {
    return <meshPhysicalMaterial color={color} roughness={0.62} metalness={0.05} sheen={0.3} transparent />
  }
  if (textures) {
    return (
      <meshPhysicalMaterial
        color="#ffffff"
        map={textures.map}
        emissive="#ffffff"
        emissiveMap={textures.map}
        emissiveIntensity={0.16}
        transmission={1}
        transmissionMap={textures.transmissionMap}
        thickness={0.3}
        roughness={roughness}
        ior={1.5}
        attenuationColor={gradientTo}
        attenuationDistance={3}
        clearcoat={finish === 'frosted' ? 0.2 : 1}
        envMapIntensity={1.3}
        transparent
      />
    )
  }
  if (lum < 0.012) {
    return (
      <meshPhysicalMaterial
        color={color}
        roughness={0.12}
        metalness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.03}
        transparent
      />
    )
  }
  const pale = lum > 0.35
  return (
    <meshPhysicalMaterial
      color={color}
      emissive={pale ? '#000000' : color}
      emissiveIntensity={0.22}
      transmission={pale ? 0.95 : 0.45}
      thickness={0.3}
      roughness={pale ? 0.03 : roughness}
      ior={1.5}
      attenuationColor={tint ?? color}
      attenuationDistance={2.5}
      clearcoat={1}
      clearcoatRoughness={0.03}
      envMapIntensity={1.4}
      transparent
    />
  )
}

type CapProps = {
  color: string
  metal?: boolean
  roughness?: number
  /** Knurl bump texture (with its own repeat). */
  bump?: Texture
}

export function CapMaterial({ color, metal = false, roughness, bump }: CapProps) {
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={metal ? 1 : 0.15}
      roughness={roughness ?? (metal ? 0.28 : 0.4)}
      clearcoat={metal ? 0 : 0.4}
      bumpMap={bump}
      bumpScale={bump ? 1.5 : 1}
      transparent
    />
  )
}

type LabelProps = {
  children: ReactNode
  color?: string
  position: [number, number, number]
  size: number
  spacing?: number
  lineHeight?: number
  anchorX?: 'left' | 'center' | 'right'
  /** Radius of the surface the label wraps around (convex). 0 = flat. */
  wrapRadius?: number
}

/** Text printed on a bottle. */
export function Label({
  children,
  color = '#f2f2f2',
  position,
  size,
  spacing = 0.08,
  lineHeight = 1,
  anchorX = 'center',
  wrapRadius = 0,
}: LabelProps) {
  const iridescent = color === 'iridescent'
  return (
    <Text
      position={position}
      fontSize={size}
      letterSpacing={spacing}
      lineHeight={lineHeight}
      anchorX={anchorX}
      anchorY="middle"
      textAlign={anchorX === 'center' ? 'center' : 'left'}
      // troika curveRadius (drei forwards it but does not type it). Positive wraps around a convex surface.
      {...({ curveRadius: wrapRadius } as object)}
      color={iridescent ? '#bfe9e2' : color}
    >
      {children}
      {iridescent ? (
        <meshPhysicalMaterial
          color="#d8fff6"
          emissive="#5fbfb0"
          emissiveIntensity={0.35}
          metalness={0.7}
          roughness={0.15}
          envMapIntensity={2.5}
          iridescence={1}
          iridescenceIOR={1.9}
          iridescenceThicknessMinimum={180}
          iridescenceThicknessMaximum={900}
          transparent
        />
      ) : (
        <meshBasicMaterial color={color} transparent toneMapped={false} />
      )}
    </Text>
  )
}
