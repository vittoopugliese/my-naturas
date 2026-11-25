import { LatheGeometry, SplineCurve, Vector2 } from 'three'

/** Smooth body of revolution from a (radius, height) profile, bottom to top. */
export function latheBody(profile: [number, number][], segments = 64) {
  const curve = new SplineCurve(profile.map(([r, y]) => new Vector2(r, y)))
  const pts = curve.getPoints(80)
  pts[0].x = 0 // close the base
  return new LatheGeometry(pts, segments)
}
