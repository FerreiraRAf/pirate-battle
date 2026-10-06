import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { Balance } from '../config'

export type ProjectileSpec = Balance['projectiles']['player']

export class Projectile {
  public readonly container = new Container()
  public readonly isEnemy: boolean
  public readonly damage: number
  public readonly radius: number
  public isDead = false

  private readonly speed: number
  private readonly maxAge: number
  private readonly heading: number
  private age = 0

  constructor(
    x: number,
    y: number,
    heading: number,
    spec: ProjectileSpec,
    isEnemy: boolean,
    texture?: Texture
  ) {
    this.container.x = x
    this.container.y = y
    this.heading = heading
    this.isEnemy = isEnemy
    this.speed = spec.speed
    this.damage = spec.damage
    this.radius = spec.radius
    this.maxAge = spec.lifetime

    if (texture) {
      const sprite = new Sprite(texture)
      sprite.anchor.set(0.5)
      sprite.width = this.radius * 3
      sprite.height = this.radius * 3
      this.container.addChild(sprite)
    } else {
      const g = new Graphics()
      g.circle(0, 0, this.radius + 1).fill(isEnemy ? 0xd90429 : 0xffb703)
      this.container.addChild(g)
    }
  }

  public update(dt: number, bounds: { width: number; height: number }): void {
    if (this.isDead) return

    this.container.x += Math.cos(this.heading) * this.speed * dt
    this.container.y += Math.sin(this.heading) * this.speed * dt

    this.age += dt
    const { x, y } = this.container
    if (this.age >= this.maxAge || x < -20 || x > bounds.width + 20 || y < -20 || y > bounds.height + 20) {
      this.isDead = true
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true })
  }
}