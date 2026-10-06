import { Container, Graphics, Sprite } from 'pixi.js'
import { AssetManager, type AssetKey } from '../systems/AssetManager'

/**
 * Irregular blob that never exceeds `radius`, so the visible sand edge always sits
 * inside the circular collision shape (ships stop where the island visibly ends).
 */
function blob(radius: number, phase: number, steps = 64): number[] {
  const points: number[] = []
  const p1 = phase * 1.7 + 0.3
  const p2 = phase * 2.9 + 1.1
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const r = radius * (0.94 + 0.03 * Math.sin(3 * a + p1) + 0.03 * Math.sin(5 * a + p2))
    points.push(Math.cos(a) * r, Math.sin(a) * r)
  }
  return points
}

/** Deterministic pseudo-random number in [0, 1): same island => same layout every match. */
function rand(seed: number): number {
  const s = Math.sin(seed * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

export class Island {
  public readonly container = new Container()
  public readonly radius: number

  /** variant only changes the shape and decoration layout, so each island looks different. */
  constructor(x: number, y: number, radius = 130, variant = 0) {
    this.container.x = x
    this.container.y = y
    this.radius = radius

    const g = new Graphics()

    // Shallow water halo (decorative, outside the collision circle)
    g.poly(blob(radius * 1.14, variant + 0.5)).fill({ color: 0x8be3ee, alpha: 0.45 })
    g.poly(blob(radius * 1.06, variant + 0.2)).fill({ color: 0xbff4f7, alpha: 0.5 })

    // Sand, filled with the sand tile (flat color if the texture is missing)
    const sandShape = blob(radius, variant)
    const sand = AssetManager.getTexture('sand')
    if (sand) g.poly(sandShape).fill({ texture: sand, color: 0xffffff })
    else g.poly(sandShape).fill(0xf3d9a4)
    g.poly(sandShape).stroke({ width: 3, color: 0xffffff, alpha: 0.7 }) // foam line

    // Grass in the middle
    const grassShape = blob(radius * 0.7, variant + 2.1)
    const grass = AssetManager.getTexture('grass')
    if (grass) g.poly(grassShape).fill({ texture: grass, color: 0xffffff })
    else g.poly(grassShape).fill(0x6dbf5a)
    g.poly(grassShape).stroke({ width: 2, color: 0x5aa84a, alpha: 0.6 })

    this.container.addChild(g)
    this.decorate(variant)
  }

  private decorate(variant: number): void {
    const r = this.radius
    const seed = variant * 31

    // Palms and plants on the grass
    this.addDecor('palm', polar(variant * 1.7 + 0.4, r * 0.12), r * 0.55, rand(seed + 1) * Math.PI * 2)
    this.addDecor('bush', polar(variant * 1.7 + 2.5, r * 0.34), r * 0.36, rand(seed + 2) * Math.PI * 2)
    this.addDecor('plant', polar(variant * 1.7 + 4.4, r * 0.3), r * 0.3, rand(seed + 3) * Math.PI * 2)

    // Mossy rock where grass meets sand
    this.addDecor('mossRock', polar(variant * 1.7 + 1.2, r * 0.66), r * 0.2, rand(seed + 4) * Math.PI * 2)

    // Rocks along the shore
    const rocks: AssetKey[] = ['rock1', 'rock2', 'rock3']
    rocks.forEach((key, k) => {
      this.addDecor(key, polar(variant * 2 + k * 2.1 + 0.6, r * 0.9), r * 0.2, rand(seed + 5 + k) * Math.PI * 2)
    })

    // A few leaves on the sand
    this.addDecor('leaves', polar(variant * 1.3 + 3.3, r * 0.82), r * 0.16, rand(seed + 9) * Math.PI * 2)
    this.addDecor('leaves', polar(variant * 1.3 + 5.6, r * 0.8), r * 0.14, rand(seed + 10) * Math.PI * 2)
  }

  private addDecor(key: AssetKey, pos: { x: number; y: number }, size: number, rotation: number): void {
    const texture = AssetManager.getTexture(key)
    if (!texture) return

    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5)
    sprite.width = size
    sprite.height = size * (texture.height / (texture.width || 1))
    sprite.rotation = rotation
    sprite.x = pos.x
    sprite.y = pos.y
    this.container.addChild(sprite)
  }

  public destroy(): void {
    this.container.destroy({ children: true })
  }
}

function polar(angle: number, distance: number): { x: number; y: number } {
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }
}